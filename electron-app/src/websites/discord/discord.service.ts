import { Injectable, Logger } from '@nestjs/common';
import { Website } from '../website.base';
import { DiscordOptions } from './discord.interface';
import { DISCORD_DEFAULT_FILE_SUBMISSION_OPTIONS } from './discord.defaults';
import { FileSubmission } from 'src/submission/file-submission/interfaces/file-submission.interface';
import { SubmissionPart } from 'src/submission/submission-part/interfaces/submission-part.interface';
import { Submission } from 'src/submission/interfaces/submission.interface';
import { LoginResponse } from '../interfaces/login-response.interface';
import { DefaultOptions } from 'src/submission/submission-part/interfaces/default-options.interface';
import { ValidationParts } from 'src/submission/validator/interfaces/validation-parts.interface';
import { FileSubmissionType } from 'src/submission/file-submission/enums/file-submission-type.enum';
import { PlaintextParser } from 'src/description-parsing/plaintext/plaintext.parser';
import UserAccountEntity from 'src/account/models/user-account.entity';
import ImageManipulator from 'src/file-manipulation/manipulators/image.manipulator';
import { FileRecord } from 'src/submission/file-submission/interfaces/file-record.interface';
import { ScalingOptions } from '../interfaces/scaling-options.interface';
import FileSize from 'src/utils/filesize.util';
import FormContent from 'src/utils/form-content.util';
import { PostResponse } from 'src/submission/post/interfaces/post-response.interface';
import { FilePostData } from 'src/submission/post/interfaces/file-post-data.interface';
import { PostData } from 'src/submission/post/interfaces/post-data.interface';
import Http from 'src/http/http.util';

interface DiscordLoginData {
  name: string;
  webhook: string;
}

@Injectable()
export class Discord extends Website {
  private readonly logger = new Logger(Discord.name);

  readonly BASE_URL: string = '';
  readonly acceptsFiles: string[] = []; // accepts all
  readonly acceptsAdditionalFiles: boolean = true;
  readonly enableAdvertisement: boolean = false;

  readonly defaultFileSubmissionOptions: DiscordOptions = DISCORD_DEFAULT_FILE_SUBMISSION_OPTIONS;
  readonly defaultDescriptionParser = PlaintextParser.parse;

  readonly usernameShortcuts = [];

  async checkLoginStatus(data: UserAccountEntity): Promise<LoginResponse> {
    const status: LoginResponse = { loggedIn: false, username: null };

    if (data.data) {
      const webhookData: DiscordLoginData = data.data;
      status.loggedIn = !!webhookData.webhook;
      status.username = webhookData.name;
    }

    return status;
  }

  getScalingOptions(file: FileRecord): ScalingOptions {
    return { maxSize: FileSize.MBtoBytes(8) };
  }

  async postNotificationSubmission(
    data: PostData<Submission, DiscordOptions>,
    accountData: DiscordLoginData,
  ): Promise<PostResponse> {
    let description = `${data.options.useTitle ? `**${data.title}**\n\n` : ''}${data.description}`
      .substring(0, 2000)
      .trim();

    const json = {
      content: description,
      username: 'PostyBirb',
      allowed_mentions: {
        parse: ['everyone', 'users', 'roles'],
      },
    };

    const res = await Http.post<any>(accountData.webhook.trim(), '', {
      data: json,
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
    data: FilePostData<DiscordOptions>,
    accountData: DiscordLoginData,
  ): Promise<PostResponse> {
    await this.postNotificationSubmission(
      data as PostData<Submission, DiscordOptions>,
      accountData,
    );
    const formData = {
      username: 'PostyBirb',
    };

    let error = null;
    const files = [data.primary, ...data.additional];
    for (const file of files) {
      if (data.options.spoiler) {
        file.file.options.filename = `SPOILER_${file.file.options.filename}`;
      }

      const res = await Http.post<any>(accountData.webhook.trim(), '', {
        data: { ...formData, file: file.file },
        type: 'multipart',
        skipCookies: true,
      });

      if (res.error || res.response.statusCode >= 300) {
        error = this.createPostResponse({
          error: res.error,
          message: 'Webhook Failure',
          additionalInfo: res.body,
        });
      }
    }

    if (error) {
      return Promise.reject(error);
    }

    return this.createPostResponse({});
  }

  preparseDescription(text: string): string {
    return text
      .replace(/(<b>|<strong>)/gm, '**')
      .replace(/(<\/b>|<\/strong>)/gm, '**')
      .replace(/(<i>|<em>)/gm, '*')
      .replace(/(<\/i>|<\/em>)/gm, '*');
  }

  parseDescription(text: string): string {
    text = super.parseDescription(text);
    const links =
      text.match(
        /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/gm,
      ) || [];
    const seenLinks = [];
    links.forEach(link => {
      if (seenLinks.includes(link)) {
        return;
      }
      seenLinks.push(link);
      text = text.replace(new RegExp(link, 'gi'), `<${link}>`);
    });
    return text;
  }

  validateFileSubmission(
    submission: FileSubmission,
    submissionPart: SubmissionPart<DiscordOptions>,
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

    const maxMB: number = 8;
    files.forEach(file => {
      const { type, size, name, mimetype } = file;
      if (FileSize.MBtoBytes(maxMB) < size) {
        if (
          isAutoscaling &&
          type === FileSubmissionType.IMAGE &&
          ImageManipulator.isMimeType(mimetype)
        ) {
          warnings.push(`${name} will be scaled down to ${maxMB}MB`);
        } else {
          problems.push(`Discord limits ${mimetype} to ${maxMB}MB`);
        }
      }
    });

    const description = this.defaultDescriptionParser(
      FormContent.getDescription(defaultPart.data.description, submissionPart.data.description),
    );

    if (description.length > 2000) {
      warnings.push('Max description length allowed is 2,000 characters.');
    }

    return { problems, warnings };
  }
}
