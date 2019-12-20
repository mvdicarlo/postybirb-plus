import { Injectable, Logger, NotImplementedException } from '@nestjs/common';
import { WebsiteService } from '../website.service';
import { DefaultDiscordOptions } from './discord.interface';
import { DISCORD_DEFAULT_FILE_SUBMISSION_OPTIONS } from './discord.defaults';
import { FileSubmission } from 'src/submission/file-submission/interfaces/file-submission.interface';
import { SubmissionPart } from 'src/submission/interfaces/submission-part.interface';
import WebsiteValidator from '../utils/website-validator.util';
import { Submission } from 'src/submission/interfaces/submission.interface';
import { UserAccount } from 'src/account/account.interface';
import { LoginResponse } from '../interfaces/login-response.interface';
import { DefaultOptions } from 'src/submission/interfaces/default-options.interface';

interface DiscordLoginData {
  name: string;
  webhook: string;
}

@Injectable()
export class Discord extends WebsiteService {
  private readonly logger = new Logger(Discord.name);

  readonly BASE_URL: string = '';
  readonly acceptsFiles: string[] = []; // accepts all

  readonly defaultStatusOptions: any = {};
  readonly defaultFileSubmissionOptions: DefaultDiscordOptions = DISCORD_DEFAULT_FILE_SUBMISSION_OPTIONS;

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
  ): string[] {
    const problems: string[] = [];

    const { size } = submission.primary;
    if (WebsiteValidator.MBtoBytes(8) < size) {
      problems.push(`Discord limits files to 8MB`);
    }

    return problems;
  }

  validateStatusSubmission(submission: Submission, submissionPart: SubmissionPart<any>): string[] {
    return [];
  }
}
