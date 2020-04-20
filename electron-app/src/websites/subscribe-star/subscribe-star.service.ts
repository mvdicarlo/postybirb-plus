import { Injectable } from '@nestjs/common';
import { Website } from '../website.base';
import {
  SubscribeStarDefaultFileOptions,
  SubscribeStarDefaultNotificationOptions,
} from './subscribe-star.defaults';
import UserAccountEntity from 'src/account/models/user-account.entity';
import { LoginResponse } from '../interfaces/login-response.interface';
import Http from 'src/http/http.util';
import { FileRecord } from 'src/submission/file-submission/interfaces/file-record.interface';
import { ScalingOptions } from '../interfaces/scaling-options.interface';
import FileSize from 'src/utils/filesize.util';
import { SubscribeStarFileOptions } from './subscribe-star.interface';
import { PostData } from 'src/submission/post/interfaces/post-data.interface';
import { Submission } from 'src/submission/interfaces/submission.interface';
import { PostResponse } from 'src/submission/post/interfaces/post-response.interface';
import { FilePostData } from 'src/submission/post/interfaces/file-post-data.interface';
import { FileSubmission } from 'src/submission/file-submission/interfaces/file-submission.interface';
import { SubmissionPart } from 'src/submission/submission-part/interfaces/submission-part.interface';
import { DefaultOptions } from 'src/submission/submission-part/interfaces/default-options.interface';
import { ValidationParts } from 'src/submission/validator/interfaces/validation-parts.interface';
import { FileSubmissionType } from 'src/submission/file-submission/enums/file-submission-type.enum';
import ImageManipulator from 'src/file-manipulation/manipulators/image.manipulator';
import { v1 } from 'uuid';
import * as cheerio from 'cheerio';
import { nativeImage } from 'electron';

@Injectable()
export class SubscribeStar extends Website {
  readonly BASE_URL = 'https://www.subscribestar.com';
  readonly fileSubmissionOptions = SubscribeStarDefaultFileOptions;
  readonly notificationOptions = SubscribeStarDefaultNotificationOptions;
  readonly acceptsAdditionalFiles = true;
  readonly usernameShortcuts = [
    {
      key: 'ss',
      url: 'https://www.subscribestar.com/$1',
    },
  ];

  readonly acceptsFiles = [];

  async checkLoginStatus(data: UserAccountEntity): Promise<LoginResponse> {
    const status: LoginResponse = { loggedIn: false, username: null };
    const res = await Http.get<string>(this.BASE_URL, data._id, { updateCookies: true });
    if (res.body.includes('top_bar-user_name')) {
      status.loggedIn = true;
      status.username = res.body.match(/<div class="top_bar-user_name">(.*?)<\/div>/)[1];
      this.storeAccountInformation(data._id, 'username', status.username);
    }
    return status;
  }

  getScalingOptions(file: FileRecord): ScalingOptions {
    return { maxSize: FileSize.MBtoBytes(5) };
  }

  parseDescription(text: string) {
    return text
      .replace(/<p/gm, '<div')
      .replace(/<\/p>/gm, '</div>')
      .replace(/\n/g, '');
  }

  async postNotificationSubmission(
    data: PostData<Submission, SubscribeStarFileOptions>,
  ): Promise<PostResponse> {
    const page = await Http.get<string>(this.BASE_URL, data.part.accountId);
    this.verifyResponse(page, 'Get CSRF');
    const csrf = page.body.match(/<meta name="csrf-token" content="(.*?)"/)[1];

    const form = {
      utf8: '✓',
      html_content: `<div>${data.description}</div>`,
      pinned_uploads: '[]',
      new_editor: 'true',
      tier_id: data.options.tier,
    };

    const post = await Http.post<{ error: any; html: string }>(
      `${this.BASE_URL}/posts.json`,
      data.part.accountId,
      {
        type: 'multipart',
        data: form,
        requestOptions: {
          json: true,
        },
        headers: {
          Referer: 'https://www.subscribestar.com/',
          'X-CSRF-Token': csrf,
        },
      },
    );

    this.verifyResponse(post, 'Verify post');
    if (post.body.error) {
      return Promise.reject(
        this.createPostResponse({ error: post.body.error, additionalInfo: post.body }),
      );
    }

    return this.createPostResponse({
      source: `${this.BASE_URL}/posts/${post.body.html.match(/data-id="(.*?)"/)[1]}`,
    });
  }

  async postFileSubmission(data: FilePostData<SubscribeStarFileOptions>): Promise<PostResponse> {
    const username: string = this.getAccountInfo(data.part.accountId, 'username');
    const page = await Http.get<string>(`${this.BASE_URL}/${username}`, data.part.accountId);
    this.verifyResponse(page, 'Get CSRF');
    page.body = page.body.replace(/\&quot;/g, '"');
    const csrf = page.body.match(/<meta name="csrf-token" content="(.*?)"/)[1];

    const files = [data.primary, ...data.additional].map(f => f.file);
    const postKey = page.body.match(/data-s3-upload-path=\\"(.*?)\\"/)[1];
    const uploadURL = page.body.match(/data-s3-url="(.*?)"/)[1];
    for (const file of files) {
      const key = `${postKey}/${v1()}.${file.options.filename.split('.').pop()}`;
      const postFile = await Http.post<string>(uploadURL, data.part.accountId, {
        type: 'multipart',
        data: {
          key,
          acl: 'public-read',
          success_action_Status: '201',
          'Content-Type': file.options.contentType,
          'x-amz-meta-original-filename': file.options.filename,
          file,
          authenticity_token: csrf,
        },
        headers: {
          Referer: 'https://www.subscribestar.com/',
          Origin: 'https://www.subscribestar.com',
        },
      });

      this.verifyResponse(postFile, 'Uploading File');
      const $ = cheerio.load(postFile.body);
      const record: any = {
        path: $('Key').text(),
        url: $('Location').text(),
        original_filename: file.options.filename,
        content_type: file.options.contentType,
        bucket: $('Bucket').text(),
        etag: $('ETag').text(),
        authenticity_token: csrf,
      };
      if (record.content_type.includes('image')) {
        const { width, height } = nativeImage.createFromBuffer(file.value).getSize();
        record.width = width;
        record.height = height;
      }
      const processFile = await Http.post(
        `${this.BASE_URL}/post_uploads/process_s3_attachments.json`,
        data.part.accountId,
        {
          type: 'json',
          data: record,
          headers: {
            Referer: `https://www.subscribestar.com/${username}`,
            Origin: 'https://www.subscribestar.com',
          },
        },
      );
      this.verifyResponse(processFile, 'Process File Upload');
    }

    const form = {
      utf8: '✓',
      html_content: `<div>${data.description}</div>`,
      pinned_uploads: '[]',
      new_editor: 'true',
      tier_id: data.options.tier,
    };

    const post = await Http.post<{ error: any; html: string }>(
      `${this.BASE_URL}/posts.json`,
      data.part.accountId,
      {
        type: 'multipart',
        data: form,
        requestOptions: {
          json: true,
        },
        headers: {
          Referer: 'https://www.subscribestar.com/',
          'X-CSRF-Token': csrf,
        },
      },
    );

    this.verifyResponse(post, 'Verify post');
    if (post.body.error) {
      return Promise.reject(
        this.createPostResponse({ error: post.body.error, additionalInfo: post.body }),
      );
    }

    return this.createPostResponse({
      source: `${this.BASE_URL}/posts/${post.body.html.match(/data-id="(.*?)"/)[1]}`,
    });
  }

  validateFileSubmission(
    submission: FileSubmission,
    submissionPart: SubmissionPart<SubscribeStarFileOptions>,
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

    files.forEach(file => {
      const { type, size, name, mimetype } = file;
      let maxMB = 5;
      if (type === FileSubmissionType.AUDIO) maxMB = 50;
      else if (type === FileSubmissionType.TEXT) maxMB = 300;
      else if (type === FileSubmissionType.VIDEO) maxMB = 250;

      if (FileSize.MBtoBytes(maxMB) < size) {
        if (
          isAutoscaling &&
          type === FileSubmissionType.IMAGE &&
          ImageManipulator.isMimeType(mimetype)
        ) {
          warnings.push(`${name} will be scaled down to ${maxMB}MB`);
        } else {
          problems.push(`SubscribeStar limits ${mimetype} to ${maxMB}MB`);
        }
      }
    });

    if (!submissionPart.data.tier) {
      problems.push('No access tier selected.');
    }

    return { problems, warnings };
  }
}
