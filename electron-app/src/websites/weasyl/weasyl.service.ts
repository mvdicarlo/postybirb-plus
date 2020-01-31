import * as _ from 'lodash';
import Http from 'src/http/http.util';
import { Injectable, Logger, NotImplementedException } from '@nestjs/common';
import { LoginResponse } from 'src/websites/interfaces/login-response.interface';
import { Submission } from 'src/submission/interfaces/submission.interface';
import { SubmissionPart } from 'src/submission/submission-part/interfaces/submission-part.interface';
import { Website } from 'src/websites/website.base';
import WebsiteValidator from 'src/websites/utils/website-validator.util';
import { FileSubmission } from 'src/submission/file-submission/interfaces/file-submission.interface';
import { FileSubmissionType } from 'src/submission/file-submission/enums/file-submission-type.enum';
import { WEASYL_DEFAULT_FILE_SUBMISSION_OPTIONS } from './weasyl.defaults';
import { DefaultWeasylOptions } from './weasyl.interface';
import { Folder } from 'src/websites/interfaces/folder.interface';
import { DefaultOptions } from 'src/submission/submission-part/interfaces/default-options.interface';
import { ValidationParts } from 'src/submission/validator/interfaces/validation-parts.interface';
import { UsernameParser } from 'src/description-parsing/miscellaneous/username.parser';
import UserAccountEntity from 'src/account/models/user-account.entity';
import ImageManipulator from 'src/file-manipulation/manipulators/image.manipulator';

@Injectable()
export class Weasyl extends Website {
  private readonly logger = new Logger(Weasyl.name);

  readonly BASE_URL: string = 'https://www.weasyl.com';
  readonly acceptsFiles: string[] = ['jpg', 'jpeg', 'png', 'gif', 'md', 'txt', 'pdf', 'swf', 'mp3'];

  readonly defaultStatusOptions: any = {};
  readonly defaultFileSubmissionOptions: DefaultWeasylOptions = WEASYL_DEFAULT_FILE_SUBMISSION_OPTIONS;

  readonly usernameShortcuts = [
    {
      key: 'ws',
      url: 'https://weasyl.com/~$1',
    },
  ];

  preparseDescription(text: string): string {
    return UsernameParser.replaceText(text, 'ws', '<!~$1>');
  }

  parseDescription(text: string): string {
    return text
      .replace(/<p/gm, '<div')
      .replace(/<\/p>/gm, '</div>')
      .replace(/style="text-align:center"/g, 'class="align-center"')
      .replace(/style="text-align:right"/g, 'class="align-right"')
      .replace(/<\/div>\n<br>/g, '</div><br>')
      .replace(/<\/div><br>/g, '</div><div><br></div>');
  }

  postStatusSubmission(data: any): Promise<any> {
    throw new NotImplementedException('Method not implemented.');
  }

  postFileSubmission(data: any): Promise<any> {
    throw new NotImplementedException('Method not implemented.');
  }

  async checkLoginStatus(data: UserAccountEntity): Promise<LoginResponse> {
    const res = await Http.get<any>(`${this.BASE_URL}/api/whoami`, data._id, {
      requestOptions: { json: true },
    });
    const status: LoginResponse = { loggedIn: false, username: null };
    try {
      const login: string = _.get(res.body, 'login');
      status.loggedIn = !!login;
      status.username = login;
      await this.retrieveFolders(data._id, status.username);
    } catch (e) {
      /* Swallow */
    }
    return status;
  }

  async retrieveFolders(id: string, loginName: string): Promise<void> {
    const res = await Http.get<{ folders: any[] }>(
      `${this.BASE_URL}/api/users/${loginName}/view`,
      id,
      {
        requestOptions: { json: true },
      },
    );

    const convertedFolders: Folder[] = [];

    const folders = res.body.folders || [];
    folders.forEach(f => {
      const folder: Folder = {
        title: f.title,
        id: f.folder_id,
      };

      convertedFolders.push(folder);

      if (f.subfolders) {
        f.subfolders.forEach(sf => {
          const subfolder: Folder = {
            title: `${folder.title} / ${sf.title}`,
            id: sf.folder_id,
          };

          convertedFolders.push(subfolder);
        });
      }
    });

    this.accountInformation.set(id, { folders: convertedFolders });
  }

  validateFileSubmission(
    submission: FileSubmission,
    submissionPart: SubmissionPart<DefaultWeasylOptions>,
    defaultPart: SubmissionPart<DefaultOptions>,
  ): ValidationParts {
    const problems: string[] = [];
    const warnings: string[] = [];
    const isAutoscaling: boolean = submissionPart.data.autoScale;

    if (WebsiteValidator.getTags(defaultPart.data.tags, submissionPart.data.tags).length < 2) {
      problems.push('Requires at least 2 tags.');
    }

    if (submissionPart.data.folder) {
      const folders: Folder[] = _.get(
        this.accountInformation.get(submissionPart.accountId),
        'folders',
        [],
      );
      if (folders.find(f => f.id === submissionPart.data.folder)) {
        warnings.push('Folder not found.');
      }
    }

    if (!WebsiteValidator.supportsFileType(submission.primary, this.acceptsFiles)) {
      if (submission.primary.type === FileSubmissionType.TEXT && !submission.fallback) {
        problems.push(
          `Does not support file format: (${submission.primary.name}) ${submission.primary.mimetype}.`,
        );
        problems.push('A fallback file is required.');
      } else if (submission.primary.type === FileSubmissionType.TEXT && submission.fallback) {
        warnings.push('The fallback text will be used.');
      } else {
        problems.push(
          `Does not support file format: (${submission.primary.name}) ${submission.primary.mimetype}.`,
        );
      }
    }

    const { type, size, name, mimetype } = submission.primary;
    let maxMB: number = 10;
    if (type === FileSubmissionType.VIDEO || type === FileSubmissionType.AUDIO) {
      maxMB = 15;
    } else if (type === FileSubmissionType.TEXT) {
      if (mimetype === 'text/markdown' || mimetype === 'text/plain') {
        maxMB = 2;
      } else {
        maxMB = 10; // assume pdf
      }
    }

    if (WebsiteValidator.MBtoBytes(maxMB) < size) {
      if (
        isAutoscaling &&
        type === FileSubmissionType.IMAGE &&
        ImageManipulator.isMimeType(submission.primary.mimetype)
      ) {
        warnings.push(`${name} will be scaled down to ${maxMB}MB`);
      } else {
        problems.push(`Weasyl limits ${submission.primary.mimetype} to ${maxMB}MB`);
      }
    }

    return { problems, warnings };
  }

  validateStatusSubmission(
    submission: Submission,
    submissionPart: SubmissionPart<any>,
  ): ValidationParts {
    return { problems: [], warnings: [] };
  }
}
