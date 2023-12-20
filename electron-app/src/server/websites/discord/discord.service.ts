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
import { DiscordAccountData } from './discord.account.interface';

@Injectable()
export class Discord extends Website {
  readonly BASE_URL: string = '';
  readonly MAX_CHARS: number = 2000;
  readonly acceptsFiles: string[] = []; // accepts all
  readonly acceptsAdditionalFiles: boolean = true;
  readonly enableAdvertisement: boolean = false;
  readonly defaultDescriptionParser = (html: string) => {
    const markdown = MarkdownParser.parse(html).replace(
      // Matches [url](text)
      /\[([^\]]+)\]\(([^\)]+)\)/g,

      // Due to discord bug [linkhere](linkhere) will be displayed
      // as is but we expect it to be clickable link
      (original, url, text) => (url === text ? url : original),
    );
    return markdown;
  };

  readonly usernameShortcuts = [];

  async checkLoginStatus(data: UserAccountEntity): Promise<LoginResponse> {
    const status: LoginResponse = { loggedIn: false, username: null };

    const webhookData: DiscordAccountData = data.data;
    if (webhookData && webhookData.webhook) {
      const channel = await Http.get<any>(webhookData.webhook, undefined, {
        requestOptions: { json: true },
      });

      if (!channel.error && channel.body.id) {
        status.loggedIn = true;
        status.username = webhookData.name;
      }
    }

    return status;
  }

  getScalingOptions(file: FileRecord): ScalingOptions {
    return { maxSize: FileSize.MBtoBytes(50) };
  }

  async postNotificationSubmission(
    cancellationToken: CancellationToken,
    data: PostData<Submission, DiscordNotificationOptions>,
    accountData: DiscordAccountData,
  ): Promise<PostResponse> {
    this.checkCancelled(cancellationToken);
    const res = await Http.post<any>(accountData.webhook.trim(), '', {
      data: this.buildDescriptionPayload(data, accountData),
      type: 'json',
      skipCookies: true,
    });

    if (res.error || res.response.statusCode >= 300) {
      return Promise.reject(
        this.createPostResponse({
          error: res.error,
          message: 'Webhook Failure',
          additionalInfo: res.body,
        }),
      );
    }

    return this.createPostResponse({ additionalInfo: res.body });
  }

  async postFileSubmission(
    cancellationToken: CancellationToken,
    data: FilePostData<DiscordFileOptions>,
    accountData: DiscordAccountData,
  ): Promise<PostResponse> {
    const formData: any = {
      payload_json: JSON.stringify(this.buildDescriptionPayload(data, accountData)),
    };

    const files = [data.primary, ...data.additional];
    files.forEach((file, i) => {
      if (data.options.spoiler) {
        file.file.options.filename = `SPOILER_${file.file.options.filename}`;
      }
      formData[`files[${i}]`] = file.file;
    });

    this.checkCancelled(cancellationToken);
    const res = await Http.post<any>(accountData.webhook.trim(), '', {
      data: formData,
      type: 'multipart',
      skipCookies: true,
    });

    if (res.error || res.response.statusCode >= 300) {
      return Promise.reject(
        this.createPostResponse({
          error: res.error,
          message: 'Webhook Failure',
          additionalInfo: res.body,
        }),
      );
    }

    return this.createPostResponse({ additionalInfo: res.body });
  }

  transformAccountData(data: DiscordAccountData) {
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

    const maxMB: number = 25;
    files.forEach(file => {
      const { type, size, name, mimetype } = file;
      if (FileSize.MBtoBytes(maxMB) < size) {
        warnings.push(
          `Discord requires files be 25MB or less, unless your channel has been boosted.`,
        );
      }
    });

    const description = this.defaultDescriptionParser(
      FormContent.getDescription(defaultPart.data.description, submissionPart.data.description),
    );

    if (description.length > this.MAX_CHARS) {
      warnings.push('Max description length allowed is 2,000 characters.');
    }

    return { problems, warnings };
  }

  validateNotificationSubmission(
    submission: FileSubmission,
    submissionPart: SubmissionPart<DiscordNotificationOptions>,
    defaultPart: SubmissionPart<DefaultOptions>,
  ): ValidationParts {
    const problems: string[] = [];
    const warnings: string[] = [];

    const description = this.defaultDescriptionParser(
      FormContent.getDescription(defaultPart.data.description, submissionPart.data.description),
    );

    if (description.length > this.MAX_CHARS) {
      warnings.push('Max description length allowed is 2,000 characters.');
    }

    return { problems, warnings };
  }

  private buildDescriptionPayload(
    data: PostData<Submission, DiscordNotificationOptions>,
    accountData: DiscordAccountData,
  ) {
    const description = data.description?.substring(0, 2000)?.trim();
    const mentions = description?.match(/(<){0,1}@(&){0,1}[a-zA-Z0-9]+(>){0,1}/g) || [];
    return {
      content: mentions.length ? mentions.join(' ') : undefined,
      // username: 'PostyBirb',
      // avatar_url: 'https://i.imgur.com/l2mt2Q7.png',
      allowed_mentions: {
        parse: ['everyone', 'users', 'roles'],
      },
      embeds: [
        {
          title: data.options.useTitle ? data.title : undefined,
          description: description?.length ? description : undefined,
          footer: {
            text: 'Posted using PostyBirb',
          },
        },
      ],
      thread_name: accountData.forum ? data.title || 'PostyBirb Post' : undefined,
    };
  }
}
