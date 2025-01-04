import { Injectable, Logger } from '@nestjs/common';
import {
  DefaultOptions,
  FileRecord,
  FileSubmission,
  FileSubmissionType,
  PostResponse,
  Submission,
  SubmissionPart,
  WordPressAccountData,
  WordPressFileOptions,
  WordPressNotificationOptions,
} from 'postybirb-commons';
import UserAccountEntity from 'src/server//account/models/user-account.entity';
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
import { HTMLFormatParser } from 'src/server/description-parsing/html/html.parser';

@Injectable()
export class WordPress extends Website {
  readonly BASE_URL: string = '';
  readonly MAX_CHARS: number = undefined; // no limit
  readonly acceptsFiles: string[] = ['png', 'webp', 'jpg', 'jpeg', 'gif'];
  readonly acceptsAdditionalFiles: boolean = false;
  readonly enableAdvertisement: boolean = false;
  
  readonly defaultDescriptionParser = (html: string) => {
    return HTMLFormatParser.parse(html);
  };

  readonly usernameShortcuts = [];

  async checkLoginStatus(data: UserAccountEntity): Promise<LoginResponse> {
    const status: LoginResponse = { loggedIn: false, username: null };

    const wordpressData: WordPressAccountData = data.data;

    const me = await Http.post<any>(wordpressData.instance + '/wp-json/wp/v2/users/me', '', {
      headers: {
        "Authorization": "Basic " + Buffer.from(wordpressData.username + ":" + wordpressData.app_password).toString("base64")
      }
    });

    const accountInfo = JSON.parse(me.body);

    if (me.error || me.response.statusCode >= 300) {
      status.loggedIn = false;
    } else if (accountInfo.capabilities.publish_posts === false) {
      throw new Error("Provided login does not have permission to publish posts");
    } else {
      status.loggedIn = true;
      status.username = accountInfo.name
    }

    return status;
  }

  getScalingOptions(file: FileRecord): ScalingOptions {
    return { maxSize: FileSize.MBtoBytes(50) };
  }

  async postNotificationSubmission(
    cancellationToken: CancellationToken,
    data: PostData<Submission, WordPressNotificationOptions>,
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

    return this.createPostResponse({ source: JSON.parse(res.body).guid.rendered, additionalInfo: res.body });
  }

  async postFileSubmission(
    cancellationToken: CancellationToken,
    data: FilePostData<WordPressFileOptions>,
    accountData: WordPressAccountData,
  ): Promise<PostResponse> {
    this.checkCancelled(cancellationToken);

    // media upload
    const fileRes = await Http.post<any>(accountData.instance + '/wp-json/wp/v2/media', '', {
      data: data.primary,
      type: 'multipart',
      skipCookies: true,
      headers: {
        "Authorization": "Basic " + Buffer.from(accountData.username + ":" + accountData.app_password).toString("base64")
      }
    });

    if (fileRes.error || fileRes.response.statusCode >= 300) {
      return Promise.reject(
        this.createPostResponse({
          error: fileRes.error,
          message: 'WordPress file upload failure',
          additionalInfo: fileRes.body,
        }),
      );
    }

    const postres = await Http.post<any>(accountData.instance + '/wp-json/wp/v2/posts', '', {
      data: this.buildDescriptionPayload(data, accountData, JSON.parse(fileRes.body).id),
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
          message: 'WordPress posting failure',
          additionalInfo: postres.body,
        }),
      );
    }

    return this.createPostResponse({
      source: JSON.parse(postres.body).guid.rendered,
      additionalInfo:
        '--- FILE UPLOAD REQUEST ---\n' +
        fileRes.body +
        '--- END OF FILE UPLOAD REQUEST - BEGIN POST UPLOAD REQUEST ---' +
        postres.body,
    });
  }

  transformAccountData(data: WordPressAccountData) {
    return data;
  }

  validateFileSubmission(
    submission: FileSubmission,
    submissionPart: SubmissionPart<WordPressFileOptions>,
    defaultPart: SubmissionPart<DefaultOptions>,
  ): ValidationParts {
    const problems: string[] = [];
    const warnings: string[] = [];

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

    const categories = submissionPart.data.categories
    if (categories) {
      categories.split(", ").forEach(categoryId => {
        if (typeof categoryId === 'number') {
          problems.push("All category IDs must be strictly numeric, separated by a comma followed by a space.")
        }
      })
    }

    const description = this.defaultDescriptionParser(
      FormContent.getDescription(defaultPart.data.description, submissionPart.data.description),
    );

    return { problems, warnings };
  }

  validateNotificationSubmission(
    submission: FileSubmission,
    submissionPart: SubmissionPart<WordPressNotificationOptions>,
    defaultPart: SubmissionPart<DefaultOptions>,
  ): ValidationParts {
    const problems: string[] = [];
    const warnings: string[] = [];

    return { problems, warnings };
  }

  private buildDescriptionPayload(
    data: PostData<Submission, WordPressNotificationOptions>,
    accountData: WordPressAccountData,
    featuredImageId: number | null,
  ) {
    const payload: any = {
      content: data.description,
      title: data.title,
      slug: data.options.slug,
      comment_status: data.options.commentStatus,
      format: data.options.format,
      status: data.options.status,
      sticky: data.options.sticky.toString(),
    };
    if (featuredImageId) payload.featured_media = featuredImageId;
    if (data.options.categories) payload.categories = data.options.categories;

    return payload;
  }
}
