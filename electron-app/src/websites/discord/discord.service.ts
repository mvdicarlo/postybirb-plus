import { Injectable, Logger, NotImplementedException } from '@nestjs/common';
import { Website } from '../website.base';
import { DefaultDiscordOptions } from './discord.interface';
import { DISCORD_DEFAULT_FILE_SUBMISSION_OPTIONS } from './discord.defaults';
import { FileSubmission } from 'src/submission/file-submission/interfaces/file-submission.interface';
import { SubmissionPart } from 'src/submission/interfaces/submission-part.interface';
import WebsiteValidator from '../utils/website-validator.util';
import { Submission } from 'src/submission/interfaces/submission.interface';
import { UserAccount } from 'src/account/account.interface';
import { LoginResponse } from '../interfaces/login-response.interface';
import { DefaultOptions } from 'src/submission/interfaces/default-options.interface';
import { ValidationParts } from 'src/submission/validator/interfaces/validation-parts.interface';
import { FileSubmissionType } from 'src/submission/file-submission/enums/file-submission-type.enum';

interface DiscordLoginData {
  name: string;
  webhook: string;
}

@Injectable()
export class Discord extends Website {
  private readonly logger = new Logger(Discord.name);

  readonly BASE_URL: string = '';
  readonly acceptsFiles: string[] = []; // accepts all

  readonly defaultStatusOptions: any = {};
  readonly defaultFileSubmissionOptions: DefaultDiscordOptions = DISCORD_DEFAULT_FILE_SUBMISSION_OPTIONS;

  readonly usernameShortcuts = [];

  async checkLoginStatus(data: UserAccount): Promise<LoginResponse> {
    const status: LoginResponse = { loggedIn: false, username: null };

    if (data.data) {
      const webhookData: DiscordLoginData = data.data;
      status.loggedIn = !!webhookData.webhook;
      status.username = webhookData.name;
    }

    return status;
  }

  parseDescription(text: string): string {
    throw new NotImplementedException('Method not implemented.');
  }

  postStatusSubmission(data: any): Promise<any> {
    throw new NotImplementedException('Method not implemented.');
  }

  postFileSubmission(data: any): Promise<any> {
    throw new NotImplementedException('Method not implemented.');
  }

  validateFileSubmission(
    submission: FileSubmission,
    submissionPart: SubmissionPart<DefaultDiscordOptions>,
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
    files
      .filter(file => !WebsiteValidator.supportsFileType(file, this.acceptsFiles))
      .forEach(file =>
        problems.push(`Does not support file format: (${file.name}) ${file.mimetype}.`),
      );

    files.forEach(file => {
      const { type, size, name } = file;
      const maxMB: number = 8;
      if (WebsiteValidator.MBtoBytes(maxMB) < size) {
        if (isAutoscaling && type === FileSubmissionType.IMAGE) {
          warnings.push(`${name} will be scaled down to ${maxMB}MB`);
        } else {
          problems.push(`Discord limits ${file.mimetype} to ${maxMB}MB`);
        }
      }
    });

    return { problems, warnings };
  }

  validateStatusSubmission(
    submission: Submission,
    submissionPart: SubmissionPart<any>,
  ): ValidationParts {
    return { problems: [], warnings: [] };
  }
}
