import { Injectable } from '@nestjs/common';
import { Website } from '../website.base';
import { ScalingOptions } from '../interfaces/scaling-options.interface';
import { FileRecord } from 'src/submission/file-submission/interfaces/file-record.interface';
import FileSize from 'src/utils/filesize.util';
import * as MastodonInstance from 'mastodon-api';
import { MastodonAccountData } from './mastodon-account.interface';
import UserAccountEntity from 'src/account/models/user-account.entity';
import { LoginResponse } from '../interfaces/login-response.interface';
import { CancellationToken } from 'src/submission/post/cancellation/cancellation-token';
import { FilePostData, PostFile } from 'src/submission/post/interfaces/file-post-data.interface';
import { PostResponse } from 'src/submission/post/interfaces/post-response.interface';
import { PostData } from 'src/submission/post/interfaces/post-data.interface';
import { Submission } from 'src/submission/interfaces/submission.interface';
import {
  MastodonDefaultFileOptions,
  MastodonDefaultNotificationOptions,
} from './mastodon.defaults';
import { MastodonFileOptions, MastodonNotificationOptions } from './mastodon.interface';
import { FileSubmission } from 'src/submission/file-submission/interfaces/file-submission.interface';
import { SubmissionPart } from 'src/submission/submission-part/interfaces/submission-part.interface';
import { DefaultOptions } from 'src/submission/submission-part/interfaces/default-options.interface';
import { ValidationParts } from 'src/submission/validator/interfaces/validation-parts.interface';
import WebsiteValidator from 'src/utils/website-validator.util';
import FormContent from 'src/utils/form-content.util';
import { FileSubmissionType } from 'src/submission/file-submission/enums/file-submission-type.enum';
import ImageManipulator from 'src/file-manipulation/manipulators/image.manipulator';
import { SubmissionRating } from 'src/submission/enums/submission-rating.enum';
import Http from 'src/http/http.util';
import { PlaintextParser } from 'src/description-parsing/plaintext/plaintext.parser';

@Injectable()
export class Mastodon extends Website {
  readonly BASE_URL = '';
  readonly enableAdvertisement = false;
  readonly acceptsAdditionalFiles = true;
  readonly fileSubmissionOptions = MastodonDefaultFileOptions;
  readonly notificationSubmissionOptions = MastodonDefaultNotificationOptions;
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

  private async uploadMedia(data: MastodonAccountData, file: PostFile): Promise<string> {
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

    return upload.body.id;
  }

  async postFileSubmission(
    cancellationToken: CancellationToken,
    data: FilePostData<MastodonFileOptions>,
    accountData: MastodonAccountData,
  ): Promise<PostResponse> {
    const M = this.getMastodonInstance(accountData);

    const files = [data.primary, ...data.additional].slice(0, 4);
    this.checkCancelled(cancellationToken);
    const uploadIds = await Promise.all(
      files.map(file => this.uploadMedia(accountData, file.file)),
    );

    const isSensitive = data.rating !== SubmissionRating.GENERAL;

    const { options } = data;
    const form: any = {
      status: `${options.useTitle ? `${data.title}\n` : ''}${data.description}`.substring(0, 500),
      sensitive:
        isSensitive || options.spoilerText ? true : data.rating !== SubmissionRating.GENERAL,
      spoiler_text: options.spoilerText,
      media_ids: uploadIds,
    };

    this.checkCancelled(cancellationToken);
    const post = await M.post('statuses', form);
    return this.createPostResponse({ source: post.data.url });
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
      status: `${options.useTitle ? `${data.title}\n` : ''}${data.description}`,
      sensitive:
        isSensitive || options.spoilerText
          ? 'yes'
          : data.rating !== SubmissionRating.GENERAL
          ? 'yes'
          : 'no',
      spoiler_text: options.spoilerText,
    };

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
        f => !f.ignoredAccounts!.includes(submissionPart.accountId),
      ),
    ];

    const maxMB: number = 300;
    files.forEach(file => {
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
