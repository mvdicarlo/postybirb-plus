import { Injectable } from '@nestjs/common';
import cheerio from 'cheerio';
import {
  DefaultOptions,
  FileRecord,
  FileSubmission,
  FileSubmissionType,
  Folder,
  PostResponse,
  SoFurryFileOptions,
  Submission,
  SubmissionPart,
  SubmissionRating,
} from 'postybirb-commons';
import UserAccountEntity from 'src/server//account/models/user-account.entity';
import { PlaintextParser } from 'src/server/description-parsing/plaintext/plaintext.parser';
import ImageManipulator from 'src/server/file-manipulation/manipulators/image.manipulator';
import Http from 'src/server/http/http.util';
import { CancellationToken } from 'src/server/submission/post/cancellation/cancellation-token';
import { FilePostData } from 'src/server/submission/post/interfaces/file-post-data.interface';
import { PostData } from 'src/server/submission/post/interfaces/post-data.interface';
import { ValidationParts } from 'src/server/submission/validator/interfaces/validation-parts.interface';
import FileSize from 'src/server/utils/filesize.util';
import FormContent from 'src/server/utils/form-content.util';
import HtmlParserUtil from 'src/server/utils/html-parser.util';
import WebsiteValidator from 'src/server/utils/website-validator.util';
import { GenericAccountProp } from '../generic/generic-account-props.enum';
import { LoginResponse } from '../interfaces/login-response.interface';
import { ScalingOptions } from '../interfaces/scaling-options.interface';
import { Website } from '../website.base';

import _ from 'lodash';
import { FallbackInformation } from '../interfaces/fallback-information.interface';
import HtmlParser from 'src/server/description-parsing/html-node/parser';
import { HTMLFormatParser } from 'src/server/description-parsing/html/html.parser';
import BrowserWindowUtil from 'src/server/utils/browser-window.util';

@Injectable()
export class SoFurry extends Website {
  readonly BASE_URL: string = 'https://www.sofurry.com';
  readonly acceptsFiles: string[] = ['png', 'jpeg', 'jpg', 'gif', 'swf', 'txt', 'mp3', 'mp4'];
  readonly usernameShortcuts = [
    {
      key: 'sf',
      url: 'https://$1.sofurry.com/',
    },
  ];

  async checkLoginStatus(data: UserAccountEntity): Promise<LoginResponse> {
    const status: LoginResponse = { loggedIn: false, username: null };
    await BrowserWindowUtil.getPage(data._id, this.BASE_URL, true);
    const res = await Http.get<string>(`${this.BASE_URL}/upload/details?contentType=1`, data._id);
    if (res.body.includes('Logout')) {
      status.loggedIn = true;

      const $ = cheerio.load(res.body);
      status.username = $('a[class=avatar]').attr('href').split('.')[0].split('/').pop();
      this.getFolders(data._id, $);
      // Http.saveSessionCookies(this.BASE_URL, data._id);
    }
    return status;
  }

  private getFolders(profileId: string, $: cheerio.Root) {
    const folders: Folder[] = [];
    $('#UploadForm_folderId')
      .children()
      .toArray()
      .forEach(o => {
        folders.push({ value: $(o).attr('value'), label: $(o).text() });
      });

    this.storeAccountInformation(profileId, GenericAccountProp.FOLDERS, folders);
  }

  getScalingOptions(file: FileRecord): ScalingOptions {
    return { maxSize: FileSize.MBtoBytes(50) };
  }

  parseDescription(text: string) {
    return HTMLFormatParser.parse(text).replace(/\n/g, '');
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

  async postFileSubmission(
    cancellationToken: CancellationToken,
    data: FilePostData<SoFurryFileOptions>,
  ): Promise<PostResponse> {
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
      'UploadForm[formtags]': this.formatTags(data.tags),
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

    this.checkCancelled(cancellationToken);
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

  fallbackFileParser(html: string): FallbackInformation {
    const t = HTMLFormatParser.parse(html);
    console.log(t);
    return { text: this.parseDescription(html), type: 'text/plain', extension: 'txt' };
  }

  async postNotificationSubmission(
    cancellationToken: CancellationToken,
    data: PostData<Submission, SoFurryFileOptions>,
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
      'UploadForm[formtags]': this.formatTags(data.tags),
      'UploadForm[contentLevel]': this.getRating(data.rating),
      'UploadForm[P_hidePublic]': '0',
      'UploadForm[folderId]': data.options.folder || '0',
      'UploadForm[newFolderName]': '',
      'UploadForm[P_isHTML]': '1',
      save: 'Publish',
    };

    this.checkCancelled(cancellationToken);
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

  formatTags(tags: string[]) {
    return tags.join(', ');
  }

  validateFileSubmission(
    submission: FileSubmission,
    submissionPart: SubmissionPart<SoFurryFileOptions>,
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
        GenericAccountProp.FOLDERS,
        [],
      );
      if (!folders.find(f => f.value === submissionPart.data.folder)) {
        warnings.push(`Folder (${submissionPart.data.folder}) not found.`);
      }
    }

    if (!WebsiteValidator.supportsFileType(submission.primary, this.acceptsFiles)) {
      if (submission.primary.type === FileSubmissionType.TEXT && !submission.fallback) {
        problems.push(`Currently supported file formats: ${this.acceptsFiles.join(', ')}`);
        problems.push('A fallback file is required.');
      } else if (submission.primary.type === FileSubmissionType.TEXT && submission.fallback) {
        warnings.push('The fallback text will be used.');
      } else {
        problems.push(`Currently supported file formats: ${this.acceptsFiles.join(', ')}`);
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
