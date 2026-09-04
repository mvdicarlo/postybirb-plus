import { Injectable } from '@nestjs/common';
import {
  DefaultOptions,
  FileRecord,
  FileSubmission,
  FileSubmissionType,
  InstagramAccountData,
  InstagramFileOptions,
  PostResponse,
  Submission,
  SubmissionPart,
} from 'postybirb-commons';
import UserAccountEntity from 'src/server/account/models/user-account.entity';
import { PlaintextParser } from 'src/server/description-parsing/plaintext/plaintext.parser';
import ImageManipulator from 'src/server/file-manipulation/manipulators/image.manipulator';
import Http from 'src/server/http/http.util';
import { CancellationToken } from 'src/server/submission/post/cancellation/cancellation-token';
import { FilePostData } from 'src/server/submission/post/interfaces/file-post-data.interface';
import { PostData } from 'src/server/submission/post/interfaces/post-data.interface';
import { ValidationParts } from 'src/server/submission/validator/interfaces/validation-parts.interface';
import FileSize from 'src/server/utils/filesize.util';
import FormContent from 'src/server/utils/form-content.util';
import WebsiteValidator from 'src/server/utils/website-validator.util';
import { LoginResponse } from '../interfaces/login-response.interface';
import { ScalingOptions } from '../interfaces/scaling-options.interface';
import { Website } from '../website.base';

@Injectable()
export class Instagram extends Website {
  readonly BASE_URL = 'https://www.instagram.com';
  readonly MAX_CHARS: number = 2200;
  readonly enableAdvertisement = false;
  readonly defaultDescriptionParser = PlaintextParser.parse;
  readonly acceptsFiles = ['jpeg', 'jpg', 'png', 'gif', 'bmp', 'webp'];
  readonly usernameShortcuts = [
    {
      key: 'ig',
      url: 'https://www.instagram.com/$1',
    },
  ];

  private readonly MAX_TAGS = 30;
  private readonly IG_APP_ID = '936619743392459';

  async checkLoginStatus(data: UserAccountEntity): Promise<LoginResponse> {
    const status: LoginResponse = { loggedIn: false, username: null };
    const cookies = await Http.getWebsiteCookies(data._id, this.BASE_URL);
    const sessionCookie = cookies.find(c => c.name === 'sessionid');
    const userIdCookie = cookies.find(c => c.name === 'ds_user_id');

    if (sessionCookie && userIdCookie) {
      status.loggedIn = true;
      try {
        const res = await Http.get<any>(
          `${this.BASE_URL}/api/v1/users/${userIdCookie.value}/info/`,
          data._id,
          {
            headers: this.getHeaders(cookies),
            requestOptions: { json: true },
          },
        );
        if (res.body?.user?.username) {
          status.username = res.body.user.username;
        } else {
          status.username = userIdCookie.value;
        }
      } catch {
        status.username = userIdCookie.value;
      }
    }

    return status;
  }

  private getCSRFToken(cookies: any[]): string {
    const csrfCookie = cookies.find(c => c.name === 'csrftoken');
    return csrfCookie?.value || '';
  }

  private getHeaders(cookies: any[]): Record<string, string> {
    return {
      'X-CSRFToken': this.getCSRFToken(cookies),
      'X-IG-App-ID': this.IG_APP_ID,
      'X-Instagram-AJAX': '1',
      'X-Requested-With': 'XMLHttpRequest',
      Referer: this.BASE_URL + '/',
      Origin: this.BASE_URL,
    };
  }

  getScalingOptions(file: FileRecord): ScalingOptions {
    return {
      maxSize: FileSize.MBtoBytes(8),
      maxWidth: 1080,
      maxHeight: 1350,
      converToJPEG: true,
    };
  }

  formatTags(tags: string[]): string[] {
    return this.parseTags(
      tags.map(tag => tag.replace(/[^a-z0-9]/gi, '')),
    )
      .filter(tag => tag.length > 0)
      .slice(0, this.MAX_TAGS)
      .map(tag => `#${tag}`);
  }

  private buildCaption(description: string, tags: string[]): string {
    const formattedTags = tags.join(' ');
    if (!formattedTags) {
      return description.substring(0, this.MAX_CHARS);
    }

    const separator = description ? '\n\n' : '';
    const combined = description + separator + formattedTags;

    if (combined.length <= this.MAX_CHARS) {
      return combined;
    }

    // Truncate tags to fit within limit
    const availableSpace = this.MAX_CHARS - description.length - separator.length;
    if (availableSpace <= 0) {
      return description.substring(0, this.MAX_CHARS);
    }

    const truncatedTags = formattedTags.substring(0, availableSpace).replace(/ #[^ ]*$/, '');
    return description + separator + truncatedTags;
  }

  async postFileSubmission(
    cancellationToken: CancellationToken,
    data: FilePostData<InstagramFileOptions>,
    accountData: InstagramAccountData,
  ): Promise<PostResponse> {
    const cookies = await Http.getWebsiteCookies(data.part.accountId, this.BASE_URL);
    const headers = this.getHeaders(cookies);
    const file = data.primary.file;

    const uploadId = Date.now().toString();
    const uploadName = `${uploadId}_0_${Math.floor(Math.random() * 9000000000 + 1000000000)}`;

    // Step 1: Upload image bytes via raw body POST
    this.checkCancelled(cancellationToken);
    const uploadRes = await Http.post<any>(
      `${this.BASE_URL}/rupload_igphoto/${uploadName}`,
      data.part.accountId,
      {
        data: file.value,
        headers: {
          ...headers,
          'Content-Type': 'image/jpeg',
          'X-Entity-Name': uploadName,
          'X-Entity-Length': file.value.length.toString(),
          'X-Instagram-Rupload-Params': JSON.stringify({
            media_type: 1,
            upload_id: uploadId,
            upload_media_height: 0,
            upload_media_width: 0,
          }),
          Offset: '0',
        },
      },
    );

    // Parse response body if it's a string
    let uploadBody = uploadRes.body;
    if (typeof uploadBody === 'string') {
      try {
        uploadBody = JSON.parse(uploadBody);
      } catch {
        // leave as string
      }
    }

    if (uploadRes.error || uploadBody?.status !== 'ok') {
      return Promise.reject(
        this.createPostResponse({
          additionalInfo: uploadBody || uploadRes.error,
          message: `Failed to upload image to Instagram. ${uploadRes.error?.message || JSON.stringify(uploadBody) || ''}`,
        }),
      );
    }

    // Step 2: Configure/publish the media
    this.checkCancelled(cancellationToken);
    const caption = this.buildCaption(data.description, this.formatTags(data.tags));
    const deviceId = `android-${uploadId.substring(0, 16)}`;
    const configureRes = await Http.post<any>(
      `${this.BASE_URL}/api/v1/media/configure/`,
      data.part.accountId,
      {
        type: 'form',
        data: {
          upload_id: uploadId,
          caption,
          source_type: '4',
          disable_comments: '0',
          device_id: deviceId,
          _uuid: deviceId,
        },
        headers,
        requestOptions: { json: true },
      },
    );

    if (configureRes.error || configureRes.body?.status !== 'ok') {
      return Promise.reject(
        this.createPostResponse({
          additionalInfo: configureRes.body || configureRes.error,
          message: configureRes.body?.message || 'Failed to publish image to Instagram.',
        }),
      );
    }

    const code = configureRes.body?.media?.code;
    const source = code ? `${this.BASE_URL}/p/${code}/` : undefined;
    return this.createPostResponse({ source });
  }

  async postNotificationSubmission(
    cancellationToken: CancellationToken,
    data: PostData<Submission, DefaultOptions>,
    accountData: InstagramAccountData,
  ): Promise<PostResponse> {
    return Promise.reject(
      this.createPostResponse({
        message: 'Instagram does not support text-only posts. An image is required.',
      }),
    );
  }

  validateFileSubmission(
    submission: FileSubmission,
    submissionPart: SubmissionPart<InstagramFileOptions>,
    defaultPart: SubmissionPart<DefaultOptions>,
  ): ValidationParts {
    const problems: string[] = [];
    const warnings: string[] = [];
    const isAutoscaling: boolean = submissionPart.data.autoScale;

    if (!WebsiteValidator.supportsFileType(submission.primary, this.acceptsFiles)) {
      problems.push(`Currently supported file formats: ${this.acceptsFiles.join(', ')}`);
    }

    const { type, size, name, mimetype } = submission.primary;

    if (type !== FileSubmissionType.IMAGE) {
      problems.push('Instagram only supports image uploads.');
    }

    const maxMB = 8;
    if (FileSize.MBtoBytes(maxMB) < size) {
      if (
        isAutoscaling &&
        type === FileSubmissionType.IMAGE &&
        ImageManipulator.isMimeType(mimetype)
      ) {
        warnings.push(`${name} will be scaled down to ${maxMB}MB`);
      } else {
        problems.push(`Instagram limits images to ${maxMB}MB`);
      }
    }

    // Warn about auto-conversion for non-native formats
    if (['image/gif', 'image/bmp', 'image/webp'].includes(mimetype)) {
      warnings.push(`${name} will be auto-converted to JPEG for Instagram.`);
    }

    const description = PlaintextParser.parse(
      FormContent.getDescription(defaultPart.data.description, submissionPart.data.description),
    );

    const tags = this.formatTags(
      FormContent.getTags(defaultPart.data.tags, submissionPart.data.tags),
    );
    const caption = this.buildCaption(description, tags);

    if (caption.length > this.MAX_CHARS) {
      problems.push(
        `Caption exceeds ${this.MAX_CHARS} character limit (${caption.length} characters).`,
      );
    }

    const allTags = FormContent.getTags(defaultPart.data.tags, submissionPart.data.tags);
    if (allTags.length > this.MAX_TAGS) {
      warnings.push(`Instagram allows a maximum of ${this.MAX_TAGS} hashtags. Tags will be truncated.`);
    }

    return { problems, warnings };
  }
}
