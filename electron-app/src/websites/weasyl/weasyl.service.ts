import { Injectable, Logger } from '@nestjs/common';
import * as _ from 'lodash';
import UserAccountEntity from 'src/account/models/user-account.entity';
import { MarkdownParser } from 'src/description-parsing/markdown/markdown.parser';
import { UsernameParser } from 'src/description-parsing/miscellaneous/username.parser';
import ImageManipulator from 'src/file-manipulation/manipulators/image.manipulator';
import Http from 'src/http/http.util';
import { SubmissionRating } from 'src/submission/enums/submission-rating.enum';
import { FileSubmissionType } from 'src/submission/file-submission/enums/file-submission-type.enum';
import { FileRecord } from 'src/submission/file-submission/interfaces/file-record.interface';
import { FileSubmission } from 'src/submission/file-submission/interfaces/file-submission.interface';
import { Submission } from 'src/submission/interfaces/submission.interface';
import { CancellationToken } from 'src/submission/post/cancellation/cancellation-token';
import { FilePostData } from 'src/submission/post/interfaces/file-post-data.interface';
import { PostData } from 'src/submission/post/interfaces/post-data.interface';
import { PostResponse } from 'src/submission/post/interfaces/post-response.interface';
import { DefaultOptions } from 'src/submission/submission-part/interfaces/default-options.interface';
import { SubmissionPart } from 'src/submission/submission-part/interfaces/submission-part.interface';
import { ValidationParts } from 'src/submission/validator/interfaces/validation-parts.interface';
import FileSize from 'src/utils/filesize.util';
import FormContent from 'src/utils/form-content.util';
import HtmlParserUtil from 'src/utils/html-parser.util';
import WebsiteValidator from 'src/utils/website-validator.util';
import { Folder } from 'src/websites/interfaces/folder.interface';
import { LoginResponse } from 'src/websites/interfaces/login-response.interface';
import { Website } from 'src/websites/website.base';
import { ScalingOptions } from '../interfaces/scaling-options.interface';
import { WeasylDefaultFileOptions } from './weasyl.defaults';
import { WeasylFileOptions } from './weasyl.interface';
import { GenericAccountProp } from '../generic/generic-account-props.enum';

@Injectable()
export class Weasyl extends Website {
  private readonly logger = new Logger(Weasyl.name);

  readonly BASE_URL: string = 'https://www.weasyl.com';
  readonly acceptsFiles: string[] = ['jpg', 'jpeg', 'png', 'gif', 'md', 'txt', 'pdf', 'swf', 'mp3'];

  readonly fileSubmissionOptions: WeasylFileOptions = WeasylDefaultFileOptions;

  readonly usernameShortcuts = [
    {
      key: 'ws',
      url: 'https://weasyl.com/~$1',
    },
  ];

  async checkLoginStatus(data: UserAccountEntity): Promise<LoginResponse> {
    const status: LoginResponse = { loggedIn: false, username: null };
    const res = await Http.get<any>(`${this.BASE_URL}/api/whoami`, data._id, {
      requestOptions: { json: true },
    });
    const login: string = _.get(res.body, 'login');
    status.loggedIn = !!login;
    status.username = login;
    await this.retrieveFolders(data._id, status.username);
    return status;
  }

  getScalingOptions(file: FileRecord): ScalingOptions {
    return { maxSize: FileSize.MBtoBytes(10) };
  }

  fallbackFileParser(html: string) {
    return {
      text: MarkdownParser.parse(html),
      type: 'text/markdown',
      extension: 'md',
    };
  }

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

  private convertRating(rating: SubmissionRating) {
    switch (rating) {
      case SubmissionRating.MATURE:
        return 30;
      case SubmissionRating.ADULT:
      case SubmissionRating.EXTREME:
        return 40;
      case SubmissionRating.GENERAL:
      default:
        return 10;
    }
  }

  private getContentType(type: FileSubmissionType) {
    switch (type) {
      case FileSubmissionType.TEXT:
        return 'literary';
      case FileSubmissionType.AUDIO:
      case FileSubmissionType.VIDEO:
        return 'multimedia';
      case FileSubmissionType.IMAGE:
      default:
        return 'visual';
    }
  }

  async postNotificationSubmission(
    cancellationToken: CancellationToken,
    data: PostData<Submission, DefaultOptions>,
  ): Promise<PostResponse> {
    const page = await Http.get<string>(`${this.BASE_URL}/submit/journal`, data.part.accountId);
    this.verifyResponse(page);

    const form = {
      token: HtmlParserUtil.getInputValue(page.body, 'token'),
      title: data.title,
      rating: this.convertRating(data.rating),
      content: data.description,
      tags: this.formatTags(data.tags),
    };

    this.checkCancelled(cancellationToken);
    const postResponse = await Http.post<string>(
      `${this.BASE_URL}/submit/journal`,
      data.part.accountId,
      {
        type: 'multipart',
        data: form,
      },
    );
    this.verifyResponse(postResponse);

    return this.createPostResponse({});
  }

  async postFileSubmission(
    cancellationToken: CancellationToken,
    data: FilePostData<WeasylFileOptions>,
  ): Promise<PostResponse> {
    const type = this.getContentType(data.primary.type);
    const url = `${this.BASE_URL}/submit/${type}`;

    const page = await Http.get<string>(url, data.part.accountId);
    this.verifyResponse(page);

    let postFile = data.primary.file;
    if (data.primary.type === FileSubmissionType.TEXT) {
      if (!WebsiteValidator.supportsFileType(data.submission.primary, this.acceptsFiles)) {
        postFile = data.fallback;
      }
    }

    const form: any = {
      token: HtmlParserUtil.getInputValue(page.body, 'token'),
      title: data.title,
      rating: this.convertRating(data.rating),
      content: data.description,
      tags: this.formatTags(data.tags),
      submitfile: postFile,
      redirect: url,
    };

    if (data.thumbnail) {
      form.thumbfile = data.thumbnail;
    }

    if (
      data.primary.type === FileSubmissionType.TEXT ||
      data.primary.type === FileSubmissionType.AUDIO ||
      data.primary.type === FileSubmissionType.VIDEO
    ) {
      if (data.thumbnail) {
        form.coverfile = data.thumbnail;
      } else {
        form.coverfile = '';
      }
    }

    const { options } = data;
    if (options.notify) form.nonotification = 'on';
    if (options.critique) form.critique = 'on';
    form.folderid = options.folder || '';
    form.subtype = options.category || '';

    this.checkCancelled(cancellationToken);
    const postResponse = await Http.post<string>(url, data.part.accountId, {
      type: 'multipart',
      data: form,
    });

    const { body } = postResponse;
    if (body.includes('You have already made a submission with this submission file')) {
      return this.createPostResponse({
        message: 'You have already made a submission with this submission file',
      });
    }

    if (body.includes('Submission Information')) {
      // Standard return
      return this.createPostResponse({
        source: postResponse.returnUrl,
      });
    } else if (
      // If they set a rating when they logged in
      body.includes(
        'This page contains content that you cannot view according to your current allowed ratings',
      )
    ) {
      return this.createPostResponse({
        source: postResponse.returnUrl,
      });
    } else if (body.includes('Weasyl experienced a technical issue')) {
      // Unknown issue so do a second check
      const recheck = await Http.get<string>(postResponse.returnUrl, data.part.accountId, {
        skipCookies: true,
      });
      if (recheck.body.includes('Submission Information')) {
        return this.createPostResponse({
          source: postResponse.returnUrl,
        });
      } else {
        return Promise.reject(
          this.createPostResponse({
            message: 'Weasyl experienced a technical issue and cannot verify if posting completed',
            additionalInfo: recheck.body,
          }),
        );
      }
    }

    // No success found
    return Promise.reject(
      this.createPostResponse({
        message: 'Unknown response from Weasyl',
        additionalInfo: postResponse.body,
      }),
    );
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
        label: f.title,
        value: f.folder_id,
      };

      convertedFolders.push(folder);

      if (f.subfolders) {
        f.subfolders.forEach(sf => {
          const subfolder: Folder = {
            label: `${folder.label} / ${sf.title}`,
            value: sf.folder_id,
          };

          convertedFolders.push(subfolder);
        });
      }
    });

    this.accountInformation.set(id, { folders: convertedFolders });
  }

  formatTags(tags: string[]) {
    return super.formatTags(tags).join(' ');
  }

  validateFileSubmission(
    submission: FileSubmission,
    submissionPart: SubmissionPart<WeasylFileOptions>,
    defaultPart: SubmissionPart<DefaultOptions>,
  ): ValidationParts {
    const problems: string[] = [];
    const warnings: string[] = [];
    const isAutoscaling: boolean = submissionPart.data.autoScale;

    if (submissionPart.data.folder) {
      const folders: Folder[] = _.get(
        this.accountInformation.get(submissionPart.accountId),
        GenericAccountProp.FOLDERS,
        [],
      );
      if (!folders.find(f => f.value === submissionPart.data.folder)) {
        warnings.push(`Folder (${submissionPart.data.folder}) not found.`);
      }
    }

    if (FormContent.getTags(defaultPart.data.tags, submissionPart.data.tags).length < 2) {
      problems.push('Requires at least 2 tags.');
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

    if (FileSize.MBtoBytes(maxMB) < size) {
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
}
