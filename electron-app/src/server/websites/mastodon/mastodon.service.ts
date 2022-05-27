import { Injectable } from '@nestjs/common';
import * as MastodonInstance from 'mastodon-api';
import {
  DefaultOptions,
  FileRecord,
  FileSubmission,
  FileSubmissionType,
  MastodonAccountData,
  MastodonFileOptions,
  MastodonNotificationOptions,
  PostResponse,
  Submission,
  SubmissionPart,
  SubmissionRating,
} from 'postybirb-commons';
import UserAccountEntity from 'src/server//account/models/user-account.entity';
import { PlaintextParser } from 'src/server/description-parsing/plaintext/plaintext.parser';
import ImageManipulator from 'src/server/file-manipulation/manipulators/image.manipulator';
import Http from 'src/server/http/http.util';
import { CancellationToken } from 'src/server/submission/post/cancellation/cancellation-token';
import {
  FilePostData,
  PostFile,
} from 'src/server/submission/post/interfaces/file-post-data.interface';
import { PostData } from 'src/server/submission/post/interfaces/post-data.interface';
import { ValidationParts } from 'src/server/submission/validator/interfaces/validation-parts.interface';
import FileSize from 'src/server/utils/filesize.util';
import FormContent from 'src/server/utils/form-content.util';
import WebsiteValidator from 'src/server/utils/website-validator.util';
import { LoginResponse } from '../interfaces/login-response.interface';
import { ScalingOptions } from '../interfaces/scaling-options.interface';
import { Website } from '../website.base';
import * as _ from 'lodash';

@Injectable()
export class Mastodon extends Website {
  readonly BASE_URL = '';
  readonly enableAdvertisement = false;
  readonly acceptsAdditionalFiles = true;
  readonly defaultDescriptionParser = PlaintextParser.parse;
  readonly acceptsFiles = [
    'png',
    'jpeg',
    'jpg',
    'gif',
    'swf',
    'flv',
    'mp4',
    'doc',
    'rtf',
    'txt',
    'mp3',
  ];

  async checkLoginStatus(data: UserAccountEntity): Promise<LoginResponse> {
    const status: LoginResponse = { loggedIn: false, username: null };
    const accountData: MastodonAccountData = data.data;
    if (accountData && accountData.token) {
      const refresh = await this.refreshToken(accountData);
      if (refresh) {
        status.loggedIn = true;
        status.username = accountData.username;
      }
    }
    return status;
  }

  // TBH not entirely sure why this is a thing, but its in the old code so... :shrug:
  private async refreshToken(data: MastodonAccountData): Promise<boolean> {
    const M = this.getMastodonInstance(data);
    return true;
  }

  private getMastodonInstance(data: MastodonAccountData) {
    return new MastodonInstance({
      access_token: data.token,
      api_url: `${data.website}/api/v1/`,
    });
  }

  getScalingOptions(file: FileRecord): ScalingOptions {
    return { maxSize: FileSize.MBtoBytes(300) };
  }

  private async uploadMedia(data: MastodonAccountData, file: PostFile): Promise<{ id: string }> {
    const upload = await Http.post<{ id: string; errors: any }>(
      `${data.website}/api/v1/media`,
      undefined,
      {
        type: 'multipart',
        data: {
          file,
        },
        requestOptions: { json: true },
        headers: {
          Accept: '*/*',
          'User-Agent': 'node-mastodon-client/PostyBirb',
          Authorization: `Bearer ${data.token}`,
        },
      },
    );

    this.verifyResponse(upload, 'Verify upload');
    if (upload.body.errors) {
      return Promise.reject(
        this.createPostResponse({ additionalInfo: upload.body, message: upload.body.errors }),
      );
    }

    return { id: upload.body.id };
  }

  async postFileSubmission(
    cancellationToken: CancellationToken,
    data: FilePostData<MastodonFileOptions>,
    accountData: MastodonAccountData,
  ): Promise<PostResponse> {
    const M = this.getMastodonInstance(accountData);

    const files = [data.primary, ...data.additional];
    this.checkCancelled(cancellationToken);
    const uploadedMedias: {
      id: string;
    }[] = [];
    for (const file of files) {
      uploadedMedias.push(await this.uploadMedia(accountData, file.file));
    }

    const isSensitive = data.rating !== SubmissionRating.GENERAL;
    const { options } = data;
    const chunks = _.chunk(uploadedMedias, 4);
    let lastId = undefined;
    for (let i = 0; i < chunks.length; i++) {
      let form = undefined;
      if (i === 0) {
        form = {
          status: `${options.useTitle && data.title ? `${data.title}\n` : ''}${
            data.description
          }`.substring(0, 500),
          sensitive: isSensitive,
          visibility: data.visibility,
          media_ids: chunks[i].map((media) => media.id),
        };
      } else {
        form = {
          sensitive: isSensitive,
          visibility: data.visibility,
          media_ids: chunks[i].map((media) => media.id),
          in_reply_to_id: lastId,
        };
      }

      if (options.spoilerText) {
        form.spoiler_text = options.spoilerText;
      }

      const post = await M.post('statuses', form);
      lastId = post.data.id;
    }

    this.checkCancelled(cancellationToken);

    return this.createPostResponse({});
  }

  async postNotificationSubmission(
    cancellationToken: CancellationToken,
    data: PostData<Submission, MastodonNotificationOptions>,
    accountData: MastodonAccountData,
  ): Promise<PostResponse> {
    const M = this.getMastodonInstance(accountData);

    const isSensitive = data.rating !== SubmissionRating.GENERAL;
    
    const { options } = data;
    const form: any = {
      status: `${options.useTitle && data.title ? `${data.title}\n` : ''}${data.description}`,
      sensitive: isSensitive,
      visibility: data.visibility,
    };

    if (options.spoilerText) {
      form.spoiler_text = options.spoilerText;
    }

    this.checkCancelled(cancellationToken);
    const post = await M.post('statuses', form);
    return this.createPostResponse({ source: post.data.url });
  }

  validateFileSubmission(
    submission: FileSubmission,
    submissionPart: SubmissionPart<MastodonFileOptions>,
    defaultPart: SubmissionPart<DefaultOptions>,
  ): ValidationParts {
    const problems: string[] = [];
    const warnings: string[] = [];
    const isAutoscaling: boolean = submissionPart.data.autoScale;

    const description = this.defaultDescriptionParser(
      FormContent.getDescription(defaultPart.data.description, submissionPart.data.description),
    );

    if (description.length > 500) {
      warnings.push(
        'Max description length allowed is 500 characters (for most Mastodon clients).',
      );
    }

    const files = [
      submission.primary,
      ...(submission.additional || []).filter(
        (f) => !f.ignoredAccounts!.includes(submissionPart.accountId),
      ),
    ];

    const maxMB: number = 300;
    files.forEach((file) => {
      const { type, size, name, mimetype } = file;
      if (!WebsiteValidator.supportsFileType(file, this.acceptsFiles)) {
        problems.push(`Does not support file format: (${name}) ${mimetype}.`);
      }

      if (FileSize.MBtoBytes(maxMB) < size) {
        if (
          isAutoscaling &&
          type === FileSubmissionType.IMAGE &&
          ImageManipulator.isMimeType(mimetype)
        ) {
          warnings.push(`${name} will be scaled down to ${maxMB}MB`);
        } else {
          problems.push(`Mastodon limits ${mimetype} to ${maxMB}MB`);
        }
      }
    });

    return { problems, warnings };
  }

  validateNotificationSubmission(
    submission: Submission,
    submissionPart: SubmissionPart<MastodonNotificationOptions>,
    defaultPart: SubmissionPart<DefaultOptions>,
  ): ValidationParts {
    const warnings = [];
    const description = this.defaultDescriptionParser(
      FormContent.getDescription(defaultPart.data.description, submissionPart.data.description),
    );

    if (description.length > 500) {
      warnings.push(
        'Max description length allowed is 500 characters (for most Mastodon clients).',
      );
    }
    return { problems: [], warnings };
  }
}
