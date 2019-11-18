import * as _ from 'lodash';
import Http from 'src/http/http.util';
import { Injectable, Logger } from '@nestjs/common';
import { LoginResponse } from 'src/websites/interfaces/login-response.interface';
import { Submission } from 'src/submission/submission.interface';
import {
  SubmissionPart,
  DefaultOptions,
} from 'src/submission/interfaces/submission-part.interface';
import { UserAccount } from 'src/account/account.interface';
import { WebsiteService } from 'src/websites/website.service';
import WebsiteValidator from 'src/websites/utils/website-validator.util';
import { FileSubmission } from 'src/submission/file-submission/file-submission.interface';
import { FileSubmissionType } from 'src/submission/file-submission/enums/file-submission-type.enum';

interface DefaultWeasylSubmissionOptions extends DefaultOptions {
  notify: boolean;
  critique: boolean;
  folder: string;
  category: string;
}

@Injectable()
export class Weasyl extends WebsiteService {
  private readonly logger = new Logger(Weasyl.name);

  readonly BASE_URL: string = 'https://www.weasyl.com';
  readonly acceptsFiles: string[] = ['jpg', 'jpeg', 'png', 'gif', 'md', 'txt', 'pdf', 'swf', 'mp3'];

  readonly defaultStatusOptions: any = {};

  readonly defaultFileSubmissionOptions: DefaultWeasylSubmissionOptions = {
    notify: true,
    critique: false,
    folder: null,
    category: null,
    tags: {
      extendDefault: true,
      value: [],
    },
    description: {
      overwriteDefault: false,
      value: '',
    },
    rating: null,
  };

  parseDescription(text: string): string {
    throw new Error('Method not implemented.');
  }

  postStatusSubmission(data: any): Promise<any> {
    throw new Error('Method not implemented.');
  }

  postFileSubmission(data: any): Promise<any> {
    throw new Error('Method not implemented.');
  }

  async checkLoginStatus(data: UserAccount): Promise<LoginResponse> {
    const res = await Http.get<any>(`${this.BASE_URL}/api/whoami`, data.id, {
      requestOptions: { json: true },
    });
    const status: LoginResponse = { loggedIn: false, username: null };
    try {
      const login: string = _.get(res.body, 'login');
      status.loggedIn = !!login;
      status.username = login;
    } catch (e) {
      /* Swallow */
    }
    return status;
  }

  validateFileSubmission(
    submission: FileSubmission,
    submissionPart: SubmissionPart<DefaultWeasylSubmissionOptions>,
  ): string[] {
    const problems: string[] = [];

    if (!WebsiteValidator.supportsFileType(submission.primary, this.acceptsFiles)) {
      problems.push(`Weasyl does not support file format: ${submission.primary.mimetype}.`);
    }

    if (submissionPart.data.tags.value.length < 2) {
      problems.push('Weasyl requires at least 2 tags.');
    }

    const { type, size, name } = submission.primary;
    let maxMB: number = 10;
    if (type === FileSubmissionType.VIDEO || type === FileSubmissionType.AUDIO) {
      maxMB = 15;
    } else if (type === FileSubmissionType.TEXT) {
      if (name.includes('.md') || name.includes('.md')) {
        maxMB = 2;
      } else {
        maxMB = 10; // assume pdf
      }
    }

    if (WebsiteValidator.MBtoBytes(maxMB) < size) {
      problems.push(`Weasyl limits ${type} to ${maxMB}MB`);
    }

    return problems;
  }

  validateStatusSubmission(submission: Submission, submissionPart: SubmissionPart<any>): string[] {
    throw new Error('Method not implemented.');
  }
}
