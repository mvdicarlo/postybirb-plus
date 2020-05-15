import { Injectable } from '@nestjs/common';
import { Website } from '../website.base';
import {
  GenericDefaultFileOptions,
  GenericDefaultNotificationOptions,
} from '../generic/generic.defaults';
import { FileRecord } from 'src/submission/file-submission/interfaces/file-record.interface';
import { ScalingOptions } from '../interfaces/scaling-options.interface';
import FileSize from 'src/utils/filesize.util';
import { PlaintextParser } from 'src/description-parsing/plaintext/plaintext.parser';
import { UsernameParser } from 'src/description-parsing/miscellaneous/username.parser';
import UserAccountEntity from 'src/account/models/user-account.entity';
import { LoginResponse } from '../interfaces/login-response.interface';
import { TwitterAccountData } from './twitter-account.interface';
import { CancellationToken } from 'src/submission/post/cancellation/cancellation-token';
import { FilePostData } from 'src/submission/post/interfaces/file-post-data.interface';
import {
  DefaultFileOptions,
  DefaultOptions,
} from 'src/submission/submission-part/interfaces/default-options.interface';
import { PostResponse } from 'src/submission/post/interfaces/post-response.interface';
import Http from 'src/http/http.util';
import { PostData } from 'src/submission/post/interfaces/post-data.interface';
import { Submission } from 'src/submission/interfaces/submission.interface';
import { FileSubmission } from 'src/submission/file-submission/interfaces/file-submission.interface';
import { SubmissionPart } from 'src/submission/submission-part/interfaces/submission-part.interface';
import { ValidationParts } from 'src/submission/validator/interfaces/validation-parts.interface';
import { FileSubmissionType } from 'src/submission/file-submission/enums/file-submission-type.enum';
import ImageManipulator from 'src/file-manipulation/manipulators/image.manipulator';
import WebsiteValidator from 'src/utils/website-validator.util';
import FormContent from 'src/utils/form-content.util';
import { OAuthUtil } from 'src/utils/oauth.util';

@Injectable()
export class Twitter extends Website {
  readonly BASE_URL = '';
  readonly acceptsAdditionalFiles = true;
  readonly enableAdvertisement = false;
  readonly fileSubmissionOptions = GenericDefaultFileOptions;
  readonly notificationSubmissionOptions = GenericDefaultNotificationOptions;
  readonly defaultDescriptionParser = PlaintextParser.parse;
  readonly acceptsFiles = ['jpeg', 'jpg', 'png', 'gif', 'webp', 'mp4', 'mov'];
  readonly usernameShortcuts = [
    {
      key: 'tw',
      url: 'https://twitter.com/$1',
    },
  ];

  getScalingOptions(file: FileRecord): ScalingOptions {
    return { maxSize: FileSize.MBtoBytes(5) };
  }

  preparseDescription(text: string) {
    return UsernameParser.replaceText(text, 'tw', '@$1');
  }

  async checkLoginStatus(data: UserAccountEntity): Promise<LoginResponse> {
    const status: LoginResponse = { loggedIn: false, username: null };
    const accountData: TwitterAccountData = data.data;
    if (accountData && accountData.oauth_token) {
      status.loggedIn = true;
      status.username = accountData.screen_name;
    }
    return status;
  }

  async postFileSubmission(
    cancellationToken: CancellationToken,
    data: FilePostData<DefaultFileOptions>,
    accountData: TwitterAccountData,
  ): Promise<PostResponse> {
    const form: any = {
      token: accountData.oauth_token,
      secret: accountData.oauth_token_secret,
      title: '',
      description: data.description,
      tags: data.tags,
      files: [data.primary, ...data.additional].map(f => ({
        data: f.file.value.toString('base64'),
        ...f.file.options,
      })),
      options: {},
    };

    this.checkCancelled(cancellationToken);
    const post = await Http.post<{ success: boolean; data: any; error: string }>(
      OAuthUtil.getURL('twitter/v1/post'),
      undefined,
      {
        type: 'json',
        data: form,
        requestOptions: { json: true },
      },
    );

    if (post.body.success) {
      return this.createPostResponse({ source: post.body.data.url });
    }

    return Promise.reject(
      this.createPostResponse({ additionalInfo: post.body, message: post.body.error }),
    );
  }

  async postNotificationSubmission(
    cancellationToken: CancellationToken,
    data: PostData<Submission, DefaultOptions>,
    accountData: TwitterAccountData,
  ): Promise<PostResponse> {
    const form: any = {
      token: accountData.oauth_token,
      secret: accountData.oauth_token_secret,
      title: '',
      description: data.description,
      tags: data.tags,
      options: {},
    };

    this.checkCancelled(cancellationToken);
    const post = await Http.post<{ success: boolean; data: { url: string }; error: string }>(
      OAuthUtil.getURL('twitter/v1/post'),
      undefined,
      {
        type: 'json',
        data: form,
        requestOptions: { json: true },
      },
    );

    console.log(post.body);
    if (post.body.success) {
      return this.createPostResponse({ source: post.body.data.url });
    }

    return Promise.reject(
      this.createPostResponse({ additionalInfo: post.body, message: post.body.error }),
    );
  }

  validateFileSubmission(
    submission: FileSubmission,
    submissionPart: SubmissionPart<DefaultFileOptions>,
    defaultPart: SubmissionPart<DefaultOptions>,
  ): ValidationParts {
    const problems: string[] = [];
    const warnings: string[] = [];
    const isAutoscaling: boolean = submissionPart.data.autoScale;

    const description = PlaintextParser.parse(
      FormContent.getDescription(defaultPart.data.description, submissionPart.data.description),
      23,
    );

    if (description.length > 280) {
      warnings.push(
        `Approximated description may surpass 280 character limit (${description.length})`,
      );
    }

    const files = [
      submission.primary,
      ...(submission.additional || []).filter(
        f => !f.ignoredAccounts!.includes(submissionPart.accountId),
      ),
    ];

    files.forEach(file => {
      const { type, size, name, mimetype } = file;
      let maxMB: number = mimetype === 'image/gif' ? 15 : 5;
      if (type === FileSubmissionType.VIDEO) {
        maxMB = 15;
      }
      if (FileSize.MBtoBytes(maxMB) < size) {
        if (
          isAutoscaling &&
          type === FileSubmissionType.IMAGE &&
          ImageManipulator.isMimeType(mimetype)
        ) {
          warnings.push(`${name} will be scaled down to ${maxMB}MB`);
        } else {
          problems.push(`Twitter limits ${mimetype} to ${maxMB}MB`);
        }
      }

      if (!WebsiteValidator.supportsFileType(file, this.acceptsFiles)) {
        problems.push(`Does not support file format: (${name}) ${mimetype}.`);
      }
    });

    return { problems, warnings };
  }

  validateNotificationSubmission(
    submission: Submission,
    submissionPart: SubmissionPart<DefaultOptions>,
    defaultPart: SubmissionPart<DefaultOptions>,
  ): ValidationParts {
    const warnings = [];

    const description = PlaintextParser.parse(
      FormContent.getDescription(defaultPart.data.description, submissionPart.data.description),
      23,
    );

    if (description.length > 280) {
      warnings.push(
        `Approximated description may surpass 280 character limit (${description.length})`,
      );
    }

    return { problems: [], warnings };
  }
}
