import { Injectable, Logger } from '@nestjs/common';
import {
  DefaultOptions,
  DiscordFileOptions,
  DiscordNotificationOptions,
  FileRecord,
  FileSubmission,
  FileSubmissionType,
  PostResponse,
  Submission,
  SubmissionPart,
  WordPressAccountData,
} from 'postybirb-commons';
import UserAccountEntity from 'src/server//account/models/user-account.entity';
import { MarkdownParser } from 'src/server/description-parsing/markdown/markdown.parser';
import ImageManipulator from 'src/server/file-manipulation/manipulators/image.manipulator';
import Http from 'src/server/http/http.util';
import { CancellationToken } from 'src/server/submission/post/cancellation/cancellation-token';
import { FilePostData } from 'src/server/submission/post/interfaces/file-post-data.interface';
import { PostData } from 'src/server/submission/post/interfaces/post-data.interface';
import { ValidationParts } from 'src/server/submission/validator/interfaces/validation-parts.interface';
import FileSize from 'src/server/utils/filesize.util';
import FormContent from 'src/server/utils/form-content.util';
import { LoginResponse } from '../interfaces/login-response.interface';
import { ScalingOptions } from '../interfaces/scaling-options.interface';
import { Website } from '../website.base';

@Injectable()
export class WordPress extends Website {
  readonly BASE_URL: string = '';
  readonly MAX_CHARS: number = 2000;
  readonly acceptsFiles: string[] = ['png', 'webp', 'svg', 'jpg', 'jpeg']; // accepts all images (?)
  readonly acceptsAdditionalFiles: boolean = true;
  readonly enableAdvertisement: boolean = false;
  readonly defaultDescriptionParser = (html: string) => {
    // TODO: we don't need this?
    return html;
  };

  readonly usernameShortcuts = [];

  async checkLoginStatus(data: UserAccountEntity): Promise<LoginResponse> {
    const status: LoginResponse = { loggedIn: false, username: null };

    const wordpressData: WordPressAccountData = data.data;
    status.loggedIn = true; // TODO actually check login
    status.username = wordpressData.username;

    return status;
  }

  getScalingOptions(file: FileRecord): ScalingOptions {
    return { maxSize: FileSize.MBtoBytes(50) };
  }

  async postNotificationSubmission(
    cancellationToken: CancellationToken,
    data: PostData<Submission, DiscordNotificationOptions>,
    accountData: WordPressAccountData,
  ): Promise<PostResponse> {
    this.checkCancelled(cancellationToken);
    const res = await Http.post<any>(accountData.instance + '/wp-json/wp/v2/posts', '', {
      data: this.buildDescriptionPayload(data, accountData, null),
      type: 'multipart',
      skipCookies: true,
      headers: {
        "Authorization": "Basic " + Buffer.from(accountData.username + ":" + accountData.app_password).toString("base64")
      }
    });

    if (res.error || res.response.statusCode >= 300) {
      return Promise.reject(
        this.createPostResponse({
          error: res.error,
          message: 'WordPress post failure',
          additionalInfo: res.body,
        }),
      );
    }

    return this.createPostResponse({ additionalInfo: res.body });
  }

  async postFileSubmission(
    cancellationToken: CancellationToken,
    data: FilePostData<DiscordFileOptions>,
    accountData: WordPressAccountData,
  ): Promise<PostResponse> {

    this.checkCancelled(cancellationToken);

    // media upload
    const fileres = await Http.post<any>(accountData.instance + '/wp-json/wp/v2/media', '', {
      data: data.primary,
      type: 'multipart',
      skipCookies: true,
      headers: {
        "Authorization": "Basic " + Buffer.from(accountData.username + ":" + accountData.app_password).toString("base64")
      }
    });

    if (fileres.error || fileres.response.statusCode >= 300) {
      return Promise.reject(
        this.createPostResponse({
          error: fileres.error,
          message: 'File Upload Failure',
          additionalInfo: fileres.body,
        }),
      );
    }

    // TODO get featured image id
    console.log(JSON.parse(fileres.body).id)
    const postres = await Http.post<any>(accountData.instance + '/wp-json/wp/v2/posts', '', {
      data: this.buildDescriptionPayload(data, accountData, JSON.parse(fileres.body).id),
      type: 'multipart',
      skipCookies: true,
      headers: {
        "Authorization": "Basic " + Buffer.from(accountData.username + ":" + accountData.app_password).toString("base64")
      }
    });

    if (postres.error || postres.response.statusCode >= 300) {
      return Promise.reject(
        this.createPostResponse({
          error: postres.error,
          message: 'Post Upload Failure',
          additionalInfo: postres.body,
        }),
      );
    }

    return this.createPostResponse({
      additionalInfo:
        '--- FILE UPLOAD REQUEST ---\n' +
        fileres.body +
        '\n--- END OF FILE UPLOAD REQUEST - BEGIN POST UPLOAD REQUEST ---\n' +
        postres.body,
    });
  }

  transformAccountData(data: WordPressAccountData) {
    return data;
  }

  validateFileSubmission(
    submission: FileSubmission,
    submissionPart: SubmissionPart<DiscordFileOptions>,
    defaultPart: SubmissionPart<DefaultOptions>,
  ): ValidationParts {
    const problems: string[] = [];
    const warnings: string[] = [];
    const isAutoscaling: boolean = submissionPart.data.autoScale;

    const files = [
      submission.primary,
      ...(submission.additional || []).filter(
        f => !f.ignoredAccounts!.includes(submissionPart.accountId),
      ),
    ];

    const maxMB: number = 2;
    files.forEach(file => {
      const { type, size, name, mimetype } = file;
      if (FileSize.MBtoBytes(maxMB) < size) {
        warnings.push(
          `WordPress often limits the maximum upload to 2MB. Please check your server configuration to confirm the maximum upload requirement.`,
        );
      }
    });

    const description = this.defaultDescriptionParser(
      FormContent.getDescription(defaultPart.data.description, submissionPart.data.description),
    );

    return { problems, warnings };
  }

  validateNotificationSubmission(
    submission: FileSubmission,
    submissionPart: SubmissionPart<DiscordNotificationOptions>,
    defaultPart: SubmissionPart<DefaultOptions>,
  ): ValidationParts {
    const problems: string[] = [];
    const warnings: string[] = [];

    return { problems, warnings };
  }

  private buildDescriptionPayload(
    data: PostData<Submission, DiscordNotificationOptions>,
    accountData: WordPressAccountData,
    featuredImageId: number | null,
  ) {
    const payload: any = { 
      content: data.description,
      title: data.title
    };
    console.log("Featured image is: ", featuredImageId)
    if (featuredImageId !== null) payload.featured_media = featuredImageId;
    return payload;
  }
}
