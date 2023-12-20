import { Injectable } from '@nestjs/common';
import cheerio from 'cheerio';
import { nativeImage } from 'electron';
import {
  DefaultOptions,
  FileRecord,
  FileSubmission,
  FileSubmissionType,
  Folder,
  PostResponse,
  Submission,
  SubmissionPart,
  SubmissionType,
  SubscribeStarFileOptions,
  SubscribeStarNotificationOptions,
  WebsiteOptions,
} from 'postybirb-commons';
import UserAccountEntity from 'src/server//account/models/user-account.entity';
import ImageManipulator from 'src/server/file-manipulation/manipulators/image.manipulator';
import Http from 'src/server/http/http.util';
import { CancellationToken } from 'src/server/submission/post/cancellation/cancellation-token';
import { FilePostData } from 'src/server/submission/post/interfaces/file-post-data.interface';
import { PostData } from 'src/server/submission/post/interfaces/post-data.interface';
import { ValidationParts } from 'src/server/submission/validator/interfaces/validation-parts.interface';
import BrowserWindowUtil from 'src/server/utils/browser-window.util';
import FileSize from 'src/server/utils/filesize.util';
import { v1 } from 'uuid';
import { GenericAccountProp } from '../generic/generic-account-props.enum';
import { LoginResponse } from '../interfaces/login-response.interface';
import { ScalingOptions } from '../interfaces/scaling-options.interface';
import { Website } from '../website.base';

import _ from 'lodash';

@Injectable()
export class SubscribeStarAdult extends Website {
  readonly BASE_URL = 'https://www.subscribestar.adult';
  readonly acceptsAdditionalFiles = true;
  readonly MAX_CHARS: number = undefined; // No Limit
  readonly enableAdvertisement: boolean = false;
  readonly usernameShortcuts = [
    // {
    //   key: 'ss',
    //   url: 'https://www.subscribestar.com/$1',
    // },
  ];

  readonly acceptsFiles = [];

  getDefaultOptions(submissionType: SubmissionType) {
    if (submissionType === SubmissionType.FILE) {
      return WebsiteOptions.SubscribeStar.FileOptions;
    }

    return WebsiteOptions.SubscribeStar.NotificationOptions;
  }

  async checkLoginStatus(data: UserAccountEntity): Promise<LoginResponse> {
    const status: LoginResponse = { loggedIn: false, username: null };
    const res = await Http.get<string>(this.BASE_URL, data._id, { updateCookies: false });
    if (res.body.includes('top_bar-user_name')) {
      status.loggedIn = true;
      status.username = res.body.match(/<div class="top_bar-user_name">(.*?)<\/div>/)[1];

      let usernameLink = res.body.match(
        /class="top_bar-branding for-adult">(.*?)href="(.*?)"/ims,
      )[2];
      if (usernameLink && usernameLink.includes('/feed')) {
        usernameLink = `/${status.username}`;
      }

      this.storeAccountInformation(data._id, 'username', usernameLink);

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
    ];

    const { body } = await Http.get<string>(`${this.BASE_URL}/profile/settings`, profileId);
    const $ = cheerio.load(body);
    $('.tiers-settings_item').each((i, el) => {
      const $el = $(el);
      tiers.push({
        label: $el.find('.tiers-settings_item-title').text(),
        value: $el.attr('data-id'),
      });
    });

    // Fill with automatic subscriber subscription when no custom tier is created
    if (tiers.length === 1) {
      tiers.push({
        label: 'Subscribers Only',
        value: 'basic',
      });
    }

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

  async postMessily(partition: string, data: Record<string, any>) {
    const cmd = `
    const data = ${JSON.stringify(data)};
    var fd = new FormData();
    Object.entries(data).forEach(([key, value]) => {
      if (Array.isArray(value)) {
        value.forEach((v) => fd.append(key, v));
      } else {
        fd.append(key, value);
      }
    });
    var xhr = new XMLHttpRequest();
    xhr.open('POST', '/posts.json', false);
    xhr.setRequestHeader("X-CSRF-Token", document.body.parentElement.innerHTML.match(/<meta name="csrf-token" content="(.*?)"/)[1]);
    xhr.send(fd);
    xhr.responseText
    `;

    const upload = await BrowserWindowUtil.runScriptOnPage<string>(
      partition,
      `${this.BASE_URL}`,
      cmd,
    );

    if (!upload) {
      throw this.createPostResponse({
        message: `Failed to upload post`,
        additionalInfo: 'Finalize',
      });
    }

    return JSON.parse(upload) as { url: string; fields?: object; error: any; html: string };
  }

  async postFileMessily(partition: string, data: Record<string, any>, url: string) {
    const cmd = `
    const data = JSON.parse('${JSON.stringify(data)}');
    var fd = new FormData();
    Object.entries(data).forEach(([key, value]) => {
      if (Array.isArray(value)) {
        value.forEach((v) => fd.append(key, v));
      } else {
        fd.append(key, value);
      }
    });
    fd.append('authenticity_token', document.body.parentElement.innerHTML.match(/<meta name="csrf-token" content="(.*?)"/)[1]);
    var xhr = new XMLHttpRequest();
    xhr.open('POST', '${url}', false);
    xhr.setRequestHeader("X-CSRF-Token", document.body.parentElement.innerHTML.match(/<meta name="csrf-token" content="(.*?)"/)[1]);
    xhr.send(fd);
    xhr.responseText
    `;

    const upload = await BrowserWindowUtil.runScriptOnPage<string>(
      partition,
      `${this.BASE_URL}`,
      cmd,
    );

    if (!upload) {
      throw this.createPostResponse({
        message: `Failed to upload post`,
        additionalInfo: 'Finalize',
      });
    }

    const res = JSON.parse(upload) as any;

    if (res.redirect_path) {
      throw this.createPostResponse({
        message: `Failed to upload post`,
        additionalInfo: 'Finalize',
      });
    }

    return res;
  }
  async postNotificationSubmission(
    cancellationToken: CancellationToken,
    data: PostData<Submission, SubscribeStarFileOptions>,
  ): Promise<PostResponse> {
    const form: Record<string, any> = {
      html_content: `<div>${data.options.useTitle && data.title ? `<h1>${data.title}</h1>` : ''}${
        data.description
      }</div>`,
      pinned_uploads: '[]',
      new_editor: 'true',
      'tier_ids[]': data.options.tiers.includes('free') ? undefined : data.options.tiers,
      'tags[]': data.tags,
      is_draft: '',
      has_poll: 'false',
      finish_date: '',
      finish_time: '',
      posting_option: 'Publish Now',
    };

    this.checkCancelled(cancellationToken);

    const post = await this.postMessily(data.part.accountId, form);

    if (post.error) {
      return Promise.reject(this.createPostResponse({ error: post.error, additionalInfo: post }));
    }

    return this.createPostResponse({
      source: `${this.BASE_URL}/posts/${post.html.match(/data-id="(.*?)"/)[1]}`,
    });
  }

  async postFileSubmission(
    cancellationToken: CancellationToken,
    data: FilePostData<SubscribeStarFileOptions>,
  ): Promise<PostResponse> {
    const usernameLink: string = this.getAccountInfo(data.part.accountId, 'username');
    let { csrf, cookies, postKey, bucket } = await BrowserWindowUtil.runScriptOnPage<{
      csrf: string;
      cookies: string;
      postKey: string;
      bucket: string;
    }>(
      data.part.accountId,
      `${this.BASE_URL}${usernameLink}`,
      `
      async function getInfo() {
        var csrf = document.body.parentElement.innerHTML.match(/<meta name="csrf-token" content="(.*?)"/)[1].trim();
        var cookies = (await cookieStore.getAll()).reduce((a, b) => \`$\{a\} $\{b.name\}=$\{b.value\};\`, '').trim();
        var postKey = document.body.parentElement.innerHTML.replace(/\&quot;/g, '"').match(/data-s3-upload-path=\\"(.*?)\\"/)[1].trim();
        var bucket = document.body.parentElement.innerHTML.replace(/\&quot;/g, '"').match(/data-s3-bucket="(.*?)"/)[1].trim();
        var out = { csrf, cookies, postKey, bucket }

        return out;
      }
      
      getInfo();
    `,
    );

    const files = [data.primary, ...data.additional].map(f => f.file);
    this.checkCancelled(cancellationToken);
    let processData = null;
    for (const file of files) {
      const key = `${postKey}/${v1()}.${file.options.filename.split('.').pop()}`;

      const presignUrl = `${
        this.BASE_URL
      }/presigned_url/upload?_=${Date.now()}&key=${encodeURIComponent(
        key,
      )}&file_name=${encodeURIComponent(file.options.filename)}&content_type=${encodeURIComponent(
        file.options.contentType,
      )}&bucket=${bucket}`;
      const presign = await Http.get<{ url: string; fields?: object }>(
        presignUrl,
        data.part.accountId,
        {
          requestOptions: {
            json: true,
          },
        },
      );

      const postFile = await Http.post<string>(presign.body.url, data.part.accountId, {
        type: 'multipart',
        data: {
          ...presign.body.fields,
          file,
          authenticity_token: csrf,
        },
        headers: {
          Referer: 'https://www.subscribestar.adult/',
          Origin: 'https://www.subscribestar.adult',
          cookie: cookies,
        },
      });

      this.verifyResponse(postFile, 'Uploading File');

      const record: any = {
        path: key,
        url: `${presign.body.url}/${key}`,
        original_filename: file.options.filename,
        content_type: file.options.contentType,
        bucket,
        authenticity_token: csrf,
      };

      if (record.content_type.includes('image')) {
        const { width, height } = nativeImage.createFromBuffer(file.value).getSize();
        record.width = width;
        record.height = height;
      }

      const processFile = await this.postFileMessily(
        data.part.accountId,
        record,
        `/post_uploads/process_s3_attachments.json`,
      );
      processData = processFile;
    }

    if (files.length > 1) {
      const order = processData.imgs_and_videos
        .sort((a, b) => a.id - b.id)
        .map(record => record.id);

      const reorder = await this.postFileMessily(
        data.part.accountId,
        {
          'upload_ids[]': order,
        },
        `/post_uploads/reorder`,
      );
    }

    const form = {
      html_content: `<div>${data.options.useTitle && data.title ? `<h1>${data.title}</h1>` : ''}${
        data.description
      }</div>`,
      pinned_uploads: '[]',
      new_editor: 'true',
      'tier_ids[]': data.options.tiers.includes('free') ? undefined : data.options.tiers,
      'tags[]': data.tags,
      is_draft: '',
      has_poll: 'false',
      finish_date: '',
      finish_time: '',
      posting_option: 'Publish Now',
    };

    const post = await this.postMessily(data.part.accountId, form);

    if (post.error) {
      return Promise.reject(this.createPostResponse({ error: post.error, additionalInfo: post }));
    }

    return this.createPostResponse({
      source: `${this.BASE_URL}/posts/${post.html.match(/data-id="(.*?)"/)[1]}`,
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

    if (!submissionPart.data.tiers) {
      problems.push('No access tiers selected.');
    }

    if (submissionPart.data.tiers && submissionPart.data.tiers.length) {
      const folders: Folder[] = _.get(
        this.accountInformation.get(submissionPart.accountId),
        GenericAccountProp.FOLDERS,
        [],
      );
      submissionPart.data.tiers.forEach(tier => {
        if (!folders.find(f => f.value === tier)) {
          warnings.push(`Access Tier (${tier}) not found.`);
        }
      });
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

    if (!submissionPart.data.tiers) {
      problems.push('No access tiers selected.');
    }

    if (submissionPart.data.tiers && submissionPart.data.tiers.length) {
      const folders: Folder[] = _.get(
        this.accountInformation.get(submissionPart.accountId),
        GenericAccountProp.FOLDERS,
        [],
      );
      submissionPart.data.tiers.forEach(tier => {
        if (!folders.find(f => f.value === tier)) {
          warnings.push(`Access Tier (${tier}) not found.`);
        }
      });
    }

    return { problems, warnings };
  }
}
