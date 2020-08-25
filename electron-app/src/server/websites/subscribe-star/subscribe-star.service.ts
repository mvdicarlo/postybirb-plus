import { Injectable } from '@nestjs/common';
import * as cheerio from 'cheerio';
import { nativeImage } from 'electron';
import UserAccountEntity from 'src/server//account/models/user-account.entity';
import ImageManipulator from 'src/server/file-manipulation/manipulators/image.manipulator';
import Http from 'src/server/http/http.util';
import { FileSubmissionType } from 'src/server/submission/file-submission/enums/file-submission-type.enum';
import { FileRecord } from 'src/server/submission/file-submission/interfaces/file-record.interface';
import { FileSubmission } from 'src/server/submission/file-submission/interfaces/file-submission.interface';
import { Submission } from 'src/server/submission/interfaces/submission.interface';
import { CancellationToken } from 'src/server/submission/post/cancellation/cancellation-token';
import { FilePostData } from 'src/server/submission/post/interfaces/file-post-data.interface';
import { PostData } from 'src/server/submission/post/interfaces/post-data.interface';
import { PostResponse } from 'src/server/submission/post/interfaces/post-response.interface';
import { DefaultOptions } from 'src/server/submission/submission-part/interfaces/default-options.interface';
import { SubmissionPart } from 'src/server/submission/submission-part/interfaces/submission-part.interface';
import { ValidationParts } from 'src/server/submission/validator/interfaces/validation-parts.interface';
import FileSize from 'src/server/utils/filesize.util';
import { v1 } from 'uuid';
import { LoginResponse } from '../interfaces/login-response.interface';
import { ScalingOptions } from '../interfaces/scaling-options.interface';
import { Website } from '../website.base';
import {
  SubscribeStarDefaultFileOptions,
  SubscribeStarDefaultNotificationOptions,
} from './subscribe-star.defaults';
import {
  SubscribeStarFileOptions,
  SubscribeStarNotificationOptions,
} from './subscribe-star.interface';
import { Folder } from '../interfaces/folder.interface';
import BrowserWindowUtil from 'src/server/utils/browser-window.util';
import { GenericAccountProp } from '../generic/generic-account-props.enum';
import _ = require('lodash');

@Injectable()
export class SubscribeStar extends Website {
  readonly BASE_URL = 'https://www.subscribestar.com';
  readonly fileSubmissionOptions = SubscribeStarDefaultFileOptions;
  readonly notificationSubmissionOptions = SubscribeStarDefaultNotificationOptions;
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
      this.storeAccountInformation(
        data._id,
        'username',
        res.body.match(/class="top_bar-branding">(.*?)href="(.*?)"/ims)[2],
      );
      await this.getTiers(data._id);
    }
    return status;
  }

  private async getTiers(profileId: string) {
    const tiers: Folder[] = [
      {
        label: 'Public',
        value: 'free',
      },
      {
        label: 'Subscribers Only',
        value: 'basic',
      },
    ];

    const body = await BrowserWindowUtil.getPage(
      profileId,
      `${this.BASE_URL}/profile/settings`,
      true,
    );
    const $ = cheerio.load(body);
    $('.tiers-settings_item').each((i, el) => {
      const $el = $(el);
      tiers.push({
        label: $el.find('.tiers-settings_item-title').text(),
        value: $el.attr('data-id'),
      });
    });

    this.storeAccountInformation(profileId, GenericAccountProp.FOLDERS, tiers);
  }

  getScalingOptions(file: FileRecord): ScalingOptions {
    return { maxSize: FileSize.MBtoBytes(5) };
  }

  parseDescription(text: string) {
    return text
      .replace(/<p/gm, '<div')
      .replace(/<\/p>/gm, '</div>')
      .replace(/<hr\s{0,1}\/{0,1}>/g, '------------<br>')
      .replace(/\n/g, '');
  }

  async postNotificationSubmission(
    cancellationToken: CancellationToken,
    data: PostData<Submission, SubscribeStarFileOptions>,
  ): Promise<PostResponse> {
    const page = await Http.get<string>(this.BASE_URL, data.part.accountId);
    this.verifyResponse(page, 'Get CSRF');
    const csrf = page.body.match(/<meta name="csrf-token" content="(.*?)"/)[1];

    const form = {
      utf8: '✓',
      html_content: `<div>${data.options.useTitle ? `<h1>${data.title}</h1>` : ''}${
        data.description
      }</div>`,
      pinned_uploads: '[]',
      new_editor: 'true',
      tier_id: data.options.tier,
    };

    this.checkCancelled(cancellationToken);
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

  async postFileSubmission(
    cancellationToken: CancellationToken,
    data: FilePostData<SubscribeStarFileOptions>,
  ): Promise<PostResponse> {
    const usernameLink: string = this.getAccountInfo(data.part.accountId, 'username');
    const page = await Http.get<string>(`${this.BASE_URL}${usernameLink}`, data.part.accountId);
    this.verifyResponse(page, 'Get CSRF');
    page.body = page.body.replace(/\&quot;/g, '"');
    const csrf = page.body.match(/<meta name="csrf-token" content="(.*?)"/)[1];

    const files = [data.primary, ...data.additional].map(f => f.file);
    const postKey = page.body.match(/data-s3-upload-path=\\"(.*?)\\"/)[1];
    const uploadURL = page.body.match(/data-s3-url="(.*?)"/)[1];
    this.checkCancelled(cancellationToken);
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
            Referer: `https://www.subscribestar.com/${usernameLink}`,
            Origin: 'https://www.subscribestar.com',
          },
        },
      );
      this.verifyResponse(processFile, 'Process File Upload');
    }

    const form = {
      utf8: '✓',
      html_content: `<div>${data.options.useTitle ? `<h1>${data.title}</h1>` : ''}${
        data.description
      }</div>`,
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

    if (!submissionPart.data.tier) {
      problems.push('No access tier selected.');
    }

    if (submissionPart.data.tier) {
      const folders: Folder[] = _.get(
        this.accountInformation.get(submissionPart.accountId),
        GenericAccountProp.FOLDERS,
        [],
      );
      if (!folders.find(f => f.value === submissionPart.data.tier)) {
        warnings.push(`Access Tier (${submissionPart.data.tier}) not found.`);
      }
    }

    const files = [
      submission.primary,
      ...(submission.additional || []).filter(
        f => !f.ignoredAccounts!.includes(submissionPart.accountId),
      ),
    ];

    files.forEach(file => {
      const { type, size, name, mimetype } = file;
      let maxMB = 5;
      if (type === FileSubmissionType.AUDIO) {
        maxMB = 50;
      } else if (type === FileSubmissionType.TEXT) {
        maxMB = 300;
      } else if (type === FileSubmissionType.VIDEO) {
        maxMB = 250;
      }

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

    return { problems, warnings };
  }

  validateNotificationSubmission(
    submission: Submission,
    submissionPart: SubmissionPart<SubscribeStarNotificationOptions>,
    defaultPart: SubmissionPart<DefaultOptions>,
  ): ValidationParts {
    const problems: string[] = [];
    const warnings: string[] = [];

    if (!submissionPart.data.tier) {
      problems.push('No access tier selected.');
    }

    if (submissionPart.data.tier) {
      const folders: Folder[] = _.get(
        this.accountInformation.get(submissionPart.accountId),
        GenericAccountProp.FOLDERS,
        [],
      );
      if (!folders.find(f => f.value === submissionPart.data.tier)) {
        warnings.push(`Access Tier (${submissionPart.data.tier}) not found.`);
      }
    }
    return { problems, warnings };
  }
}
