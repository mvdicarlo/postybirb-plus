import { Injectable } from '@nestjs/common';
import {
  DefaultOptions,
  FileRecord,
  FileSubmission,
  FileSubmissionType,
  PostResponse,
  Submission,
  SubmissionPart,
  SubmissionRating,
  TumblrAccountData,
  TumblrFileOptions,
  TumblrNotificationOptions,
} from 'postybirb-commons';
import UserAccountEntity from 'src/server//account/models/user-account.entity';
import { CustomHTMLParser } from 'src/server/description-parsing/html/custom.parser';
import ImageManipulator from 'src/server/file-manipulation/manipulators/image.manipulator';
import Http from 'src/server/http/http.util';
import { CancellationToken } from 'src/server/submission/post/cancellation/cancellation-token';
import { FilePostData } from 'src/server/submission/post/interfaces/file-post-data.interface';
import { PostData } from 'src/server/submission/post/interfaces/post-data.interface';
import { ValidationParts } from 'src/server/submission/validator/interfaces/validation-parts.interface';
import FileSize from 'src/server/utils/filesize.util';
import { OAuthUtil } from 'src/server/utils/oauth.util';
import WebsiteValidator from 'src/server/utils/website-validator.util';
import { LoginResponse } from '../interfaces/login-response.interface';
import { ScalingOptions } from '../interfaces/scaling-options.interface';
import { Website } from '../website.base';

@Injectable()
export class Tumblr extends Website {
  readonly BASE_URL = '';
  readonly acceptsFiles = ['png', 'jpeg', 'jpg', 'gif', 'mp3', 'mp4'];
  readonly acceptsAdditionalFiles = true;
  readonly refreshInterval = 45 * 60000;
  readonly usernameShortcuts = [
    {
      key: 'tu',
      url: 'https://$1.tumblr.com/',
    },
  ];

  async checkLoginStatus(data: UserAccountEntity): Promise<LoginResponse> {
    const status: LoginResponse = { loggedIn: false, username: null };
    const accountData: TumblrAccountData = data.data;
    if (accountData && accountData.token && accountData.secret) {
      status.loggedIn = true;
      status.username = accountData.user.name;
      this.storeAccountInformation(data._id, 'blogs', accountData.user.blogs);
    }
    return status;
  }

  getScalingOptions(file: FileRecord): ScalingOptions {
    return { maxSize: FileSize.MBtoBytes(10) };
  }

  preparseDescription(text: string) {
    return CustomHTMLParser.parse(text.replace(/<p/gm, '<div').replace(/<\/p>/gm, '</div>'))
      .replace(/<s>/gm, '<strike>')
      .replace(/<\/s>/gm, '</strike>');
  }

  parseDescription(text: string) {
    return text;
  }

  async postFileSubmission(
    cancellationToken: CancellationToken,
    data: FilePostData<TumblrFileOptions>,
    accountData: TumblrAccountData,
  ): Promise<PostResponse> {
    const { options } = data;
    const title = options.useTitle ? `<h1>${data.title}</h1>` : '';
    const form: any = {
      token: accountData.token,
      secret: accountData.secret,
      title,
      description: data.description,
      tags: data.tags,
      files: [data.primary, ...data.additional].map(f => ({
        data: f.file.value.toString('base64'),
        ...f.file.options,
      })),
      options: {
        blog: options.blog
          ? options.blog
          : this.getAccountInfo(data.part.accountId, 'blogs').find(b => b.primary).name,
      },
    };

    this.checkCancelled(cancellationToken);
    const post = await Http.post<{ success: boolean; data: { id_string: string }; error: string }>(
      OAuthUtil.getURL('tumblr/v1/post'),
      undefined,
      {
        type: 'json',
        data: form,
        requestOptions: { json: true },
      },
    );

    if (post.body.success) {
      return this.createPostResponse({
        source: `https://${form.options.blog}.tumblr.com/post/${post.body.data.id_string}/`,
      });
    }

    return Promise.reject(
      this.createPostResponse({ additionalInfo: post.body, message: post.body.error }),
    );
  }

  async postNotificationSubmission(
    cancellationToken: CancellationToken,
    data: PostData<Submission, TumblrNotificationOptions>,
    accountData: TumblrAccountData,
  ): Promise<PostResponse> {
    const { options } = data;
    const title = options.useTitle ? data.title : '';
    const form: any = {
      token: accountData.token,
      secret: accountData.secret,
      title,
      description: data.description,
      tags: data.tags,
      options: {
        blog: options.blog
          ? options.blog
          : this.getAccountInfo(data.part.accountId, 'blogs').find(b => b.primary).name,
      },
    };

    this.checkCancelled(cancellationToken);
    const post = await Http.post<{ success: boolean; data: { id_string: string }; error: string }>(
      OAuthUtil.getURL('tumblr/v1/post'),
      undefined,
      {
        type: 'json',
        data: form,
        requestOptions: { json: true },
      },
    );

    if (post.body.success) {
      return this.createPostResponse({
        source: `https://${form.options.blog}.tumblr.com/post/${post.body.data.id_string}/`,
      });
    }

    return Promise.reject(
      this.createPostResponse({ additionalInfo: post.body, message: post.body.error }),
    );
  }

  validateFileSubmission(
    submission: FileSubmission,
    submissionPart: SubmissionPart<TumblrFileOptions>,
    defaultPart: SubmissionPart<DefaultOptions>,
  ): ValidationParts {
    const problems: string[] = [];
    const warnings: string[] = [];
    const isAutoscaling: boolean = submissionPart.data.autoScale;

    if (!submissionPart.data.blog) {
      warnings.push('Default blog will be used.');
    }

    const rating = submissionPart.data.rating || defaultPart.data.rating;
    if (rating && rating !== SubmissionRating.GENERAL) {
      warnings.push(`${rating} rating may violate website guidelines.`);
    }

    const files = [
      submission.primary,
      ...(submission.additional || []).filter(
        f => !f.ignoredAccounts!.includes(submissionPart.accountId),
      ),
    ];

    files.forEach(file => {
      const { type, size, name, mimetype } = file;
      if (!WebsiteValidator.supportsFileType(file, this.acceptsFiles)) {
        problems.push(`Does not support file format: (${name}) ${mimetype}.`);
      }

      let maxMB: number = 10;
      if (type === FileSubmissionType.IMAGE && mimetype === 'image/gif') {
        maxMB = 1;
      } else if (type === FileSubmissionType.VIDEO) {
        maxMB = 100;
      }
      if (FileSize.MBtoBytes(maxMB) < size) {
        if (
          isAutoscaling &&
          type === FileSubmissionType.IMAGE &&
          ImageManipulator.isMimeType(mimetype)
        ) {
          warnings.push(`${name} will be scaled down to ${maxMB}MB`);
        } else {
          problems.push(`Tumblr limits ${mimetype} to ${maxMB}MB`);
        }
      }
    });

    return { problems, warnings };
  }

  validateNotificationSubmission(
    submission: FileSubmission,
    submissionPart: SubmissionPart<TumblrNotificationOptions>,
    defaultPart: SubmissionPart<DefaultOptions>,
  ): ValidationParts {
    const problems: string[] = [];
    const warnings: string[] = [];

    if (!submissionPart.data.blog) {
      warnings.push('Default blog will be used.');
    }

    const rating = submissionPart.data.rating || defaultPart.data.rating;
    if (rating && rating !== SubmissionRating.GENERAL) {
      problems.push(`${rating} rating may violate website guidelines.`);
    }

    return { problems, warnings };
  }
}
