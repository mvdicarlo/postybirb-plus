import { Injectable } from '@nestjs/common';
import { Website } from '../website.base';
import { SoFurryOptions } from './so-furry.interface';
import { SOFURRY_DEFAULT_FILE_SUBMISSION_OPTIONS } from './so-furry.defaults';
import UserAccountEntity from 'src/account/models/user-account.entity';
import { LoginResponse } from '../interfaces/login-response.interface';
import Http from 'src/http/http.util';
import * as cheerio from 'cheerio';
import { Folder } from '../interfaces/folder.interface';
import { FileRecord } from 'src/submission/file-submission/interfaces/file-record.interface';
import { ScalingOptions } from '../interfaces/scaling-options.interface';
import FileSize from 'src/utils/filesize.util';
import { FilePostData } from 'src/submission/post/interfaces/file-post-data.interface';
import { PostResponse } from 'src/submission/post/interfaces/post-response.interface';
import { PostData } from 'src/submission/post/interfaces/post-data.interface';
import { Submission } from 'src/submission/interfaces/submission.interface';
import { FileSubmission } from 'src/submission/file-submission/interfaces/file-submission.interface';
import { SubmissionPart } from 'src/submission/submission-part/interfaces/submission-part.interface';
import { DefaultOptions } from 'src/submission/submission-part/interfaces/default-options.interface';
import { ValidationParts } from 'src/submission/validator/interfaces/validation-parts.interface';
import FormContent from 'src/utils/form-content.util';
import _ = require('lodash');
import WebsiteValidator from 'src/utils/website-validator.util';
import { FileSubmissionType } from 'src/submission/file-submission/enums/file-submission-type.enum';
import ImageManipulator from 'src/file-manipulation/manipulators/image.manipulator';
import { SubmissionRating } from 'src/submission/enums/submission-rating.enum';
import HtmlParserUtil from 'src/utils/html-parser.util';
import { PlaintextParser } from 'src/description-parsing/plaintext/plaintext.parser';

@Injectable()
export class SoFurry extends Website {
  readonly BASE_URL: string = 'https://www.sofurry.com';
  readonly acceptsFiles: string[] = ['png', 'jpeg', 'jpg', 'gif', 'swf', 'txt', 'mp3'];

  readonly defaultFileSubmissionOptions: SoFurryOptions = SOFURRY_DEFAULT_FILE_SUBMISSION_OPTIONS;

  readonly usernameShortcuts = [
    {
      key: 'sf',
      url: 'https://$1.sofurry.com/',
    },
  ];

  async checkLoginStatus(data: UserAccountEntity): Promise<LoginResponse> {
    const status: LoginResponse = { loggedIn: false, username: null };
    const res = await Http.get<string>(`${this.BASE_URL}/upload/details?contentType=1`, data._id);
    if (res.body.includes('Logout')) {
      status.loggedIn = true;

      const $ = cheerio.load(res.body);
      status.username = $('a[class=avatar]')
        .attr('href')
        .split('.')[0]
        .split('/')
        .pop();
      this.getFolders(data._id, $);
      Http.saveSessionCookies(this.BASE_URL, data._id);
    }
    return status;
  }

  private async getFolders(profileId: string, $: CheerioStatic) {
    const folders: Folder[] = [];
    $('#UploadForm_folderId')
      .children()
      .toArray()
      .forEach(o => {
        folders.push({ id: $(o).attr('value'), title: $(o).text() });
      });

    this.storeAccountInformation(profileId, 'folders', folders);
  }

  getScalingOptions(file: FileRecord): ScalingOptions {
    return { maxSize: FileSize.MBtoBytes(50) };
  }

  parseDescription(text: string) {
    return text
      .replace(/<p/gm, '<div')
      .replace(/<\/p>/gm, '</div>')
      .replace(/<\/div>\n<br>/g, '</div>\n<div><br></div>');
  }

  private getSubmissionType(type: FileSubmissionType): string {
    switch (type) {
      case FileSubmissionType.AUDIO:
        return '2';
      case FileSubmissionType.TEXT:
        return '0';
      case FileSubmissionType.IMAGE:
      case FileSubmissionType.VIDEO:
      default:
        return '1';
    }
  }

  private getRating(rating: SubmissionRating) {
    switch (rating) {
      case SubmissionRating.EXTREME:
        return '2';
      case SubmissionRating.ADULT:
      case SubmissionRating.MATURE:
        return '1';
      case SubmissionRating.GENERAL:
      default:
        return '0';
    }
  }

  async postFileSubmission(data: FilePostData<SoFurryOptions>): Promise<PostResponse> {
    const url = `${this.BASE_URL}/upload/details?contentType=${this.getSubmissionType(
      data.primary.type,
    )}`;
    const page = await Http.get<string>(url, data.part.accountId);
    this.verifyResponse(page, 'Get form page');

    const form: any = {
      YII_CSRF_TOKEN: HtmlParserUtil.getInputValue(page.body, 'YII_CSRF_TOKEN'),
      'UploadForm[binarycontent_5]': data.thumbnail || '',
      'UploadForm[P_title]': data.title,
      'UploadForm[description]': data.description.replace(/<\/div>(\n|\r)/g, '</div>'),
      'UploadForm[formtags]': data.tags.join(', '),
      'UploadForm[contentLevel]': this.getRating(data.rating),
      'UploadForm[P_hidePublic]': '0',
      'UploadForm[folderId]': data.options.folder || '0',
    };

    if (data.primary.type === FileSubmissionType.TEXT) {
      form['UploadForm[textcontent]'] = data.primary.file.value;
      if (!WebsiteValidator.supportsFileType(data.submission.primary, this.acceptsFiles)) {
        form['UploadForm[textcontent]'] = data.fallback.value;
      }
      if (data.options.thumbnailAsCoverArt) {
        form['UploadForm[binarycontent_25]'] = data.thumbnail || '';
      }
    } else {
      form['UploadForm[binarycontent]'] = data.primary.file;
    }

    const post = await Http.post<string>(url, data.part.accountId, {
      type: 'multipart',
      data: form,
      headers: {
        referer: url,
      },
    });

    this.verifyResponse(post, 'Verify posted');
    if (post.body.includes('edit')) {
      return this.createPostResponse({ source: post.returnUrl });
    }

    return Promise.reject(this.createPostResponse({ additionalInfo: post.body }));
  }

  async postNotificationSubmission(
    data: PostData<Submission, SoFurryOptions>,
  ): Promise<PostResponse> {
    const url = `${this.BASE_URL}/upload/details?contentType=3`;
    const page = await Http.get<string>(url, data.part.accountId);
    this.verifyResponse(page, 'Get form page');

    const form: any = {
      YII_CSRF_TOKEN: HtmlParserUtil.getInputValue(page.body, 'YII_CSRF_TOKEN'),
      'UploadForm[P_id]': HtmlParserUtil.getInputValue(page.body, 'UploadForm[P_id]'),
      'UploadForm[P_title]': data.title,
      'UploadForm[textcontent]': data.description,
      'UploadForm[description]': PlaintextParser.parse(data.description.split('\n')[0]),
      'UploadForm[formtags]': data.tags.join(', '),
      'UploadForm[contentLevel]': this.getRating(data.rating),
      'UploadForm[P_hidePublic]': '0',
      'UploadForm[folderId]': data.options.folder || '0',
      'UploadForm[newFolderName]': '',
      'UploadForm[P_isHTML]': '1',
      save: 'Publish',
    };

    console.log(url, form);

    const post = await Http.post<string>(url, data.part.accountId, {
      type: 'multipart',
      data: form,
      headers: {
        referer: url,
      },
    });

    this.verifyResponse(post, 'Verify posted');
    if (post.body.includes('edit')) {
      return this.createPostResponse({ source: post.returnUrl });
    }

    return Promise.reject(this.createPostResponse({ additionalInfo: post.body }));
  }

  validateFileSubmission(
    submission: FileSubmission,
    submissionPart: SubmissionPart<SoFurryOptions>,
    defaultPart: SubmissionPart<DefaultOptions>,
  ): ValidationParts {
    const problems: string[] = [];
    const warnings: string[] = [];
    const isAutoscaling: boolean = submissionPart.data.autoScale;

    if (FormContent.getTags(defaultPart.data.tags, submissionPart.data.tags).length < 2) {
      problems.push('Requires at least 2 tags.');
    }

    if (submissionPart.data.folder) {
      const folders: Folder[] = _.get(
        this.accountInformation.get(submissionPart.accountId),
        'folders',
        [],
      );
      if (!folders.find(f => f.id === submissionPart.data.folder)) {
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

    const { type, size, name } = submission.primary;
    let maxMB: number = 50;
    if (FileSize.MBtoBytes(maxMB) < size) {
      if (
        isAutoscaling &&
        type === FileSubmissionType.IMAGE &&
        ImageManipulator.isMimeType(submission.primary.mimetype)
      ) {
        warnings.push(`${name} will be scaled down to ${maxMB}MB`);
      } else {
        problems.push(`SoFurry limits ${submission.primary.mimetype} to ${maxMB}MB`);
      }
    }

    return { problems, warnings };
  }
}
