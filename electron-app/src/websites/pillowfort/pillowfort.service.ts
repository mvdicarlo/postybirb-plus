import { Injectable } from '@nestjs/common';
import { Website } from '../website.base';
import {
  PillowfortDefaultNotificationOptions,
  PillowfortDefaultFileOptions,
} from './pillowfort.defaults';
import UserAccountEntity from 'src/account/models/user-account.entity';
import { LoginResponse } from '../interfaces/login-response.interface';
import Http from 'src/http/http.util';
import { FileRecord } from 'src/submission/file-submission/interfaces/file-record.interface';
import { PillowfortFileOptions, PillowfortNotificationOptions } from './pillowfort.interface';
import { FileSubmission } from 'src/submission/file-submission/interfaces/file-submission.interface';
import { SubmissionPart } from 'src/submission/submission-part/interfaces/submission-part.interface';
import { DefaultOptions } from 'src/submission/submission-part/interfaces/default-options.interface';
import { ValidationParts } from 'src/submission/validator/interfaces/validation-parts.interface';
import WebsiteValidator from 'src/utils/website-validator.util';
import { CancellationToken } from 'src/submission/post/cancellation/cancellation-token';
import { Submission } from 'src/submission/interfaces/submission.interface';
import { PostResponse } from 'src/submission/post/interfaces/post-response.interface';
import HtmlParserUtil from 'src/utils/html-parser.util';
import { SubmissionRating } from 'src/submission/enums/submission-rating.enum';
import { FilePostData } from 'src/submission/post/interfaces/file-post-data.interface';
import { PostData } from 'src/submission/post/interfaces/post-data.interface';
import * as FormData from 'form-data';
import BrowserWindowUtil from 'src/utils/browser-window.util';

@Injectable()
export class Pillowfort extends Website {
  readonly BASE_URL = 'https://www.pillowfort.social';
  readonly acceptsFiles = ['png', 'jpeg', 'jpg', 'gif'];
  readonly fileSubmissionOptions = PillowfortDefaultFileOptions;
  readonly notificationSubmissionOptions = PillowfortDefaultNotificationOptions;
  readonly usernameShortcuts = [
    {
      key: 'pf',
      url: 'https://www.pillowfort.social/$1',
    },
  ];

  async checkLoginStatus(data: UserAccountEntity): Promise<LoginResponse> {
    const status: LoginResponse = { loggedIn: false, username: null };
    const res = await Http.get<string>(this.BASE_URL, data._id);
    await BrowserWindowUtil.getPage(data._id, this.BASE_URL);
    if (res.body.includes('/signout')) {
      status.loggedIn = true;
      status.username = res.body.match(/value="current_user">(.*?)</)[1];
    }
    return status;
  }

  parseDescription(text: string) {
    return text;
  }

  getScalingOptions(file: FileRecord) {
    return undefined;
  }

  async postFileSubmission(
    cancellationToken: CancellationToken,
    data: FilePostData<PillowfortFileOptions>,
  ): Promise<PostResponse> {
    return null;
    // const url = `${this.BASE_URL}/upload/details?contentType=${this.getSubmissionType(
    //   data.primary.type,
    // )}`;
    // const page = await Http.get<string>(url, data.part.accountId);
    // this.verifyResponse(page, 'Get form page');

    // const form: any = {
    //   YII_CSRF_TOKEN: HtmlParserUtil.getInputValue(page.body, 'YII_CSRF_TOKEN'),
    //   'UploadForm[binarycontent_5]': data.thumbnail || '',
    //   'UploadForm[P_title]': data.title,
    //   'UploadForm[description]': data.description.replace(/<\/div>(\n|\r)/g, '</div>'),
    //   'UploadForm[formtags]': this.formatTags(data.tags),
    //   'UploadForm[contentLevel]': this.getRating(data.rating),
    //   'UploadForm[P_hidePublic]': '0',
    //   'UploadForm[folderId]': data.options.folder || '0',
    // };

    // if (data.primary.type === FileSubmissionType.TEXT) {
    //   form['UploadForm[textcontent]'] = data.primary.file.value;
    //   if (!WebsiteValidator.supportsFileType(data.submission.primary, this.acceptsFiles)) {
    //     form['UploadForm[textcontent]'] = data.fallback.value;
    //   }
    //   if (data.options.thumbnailAsCoverArt) {
    //     form['UploadForm[binarycontent_25]'] = data.thumbnail || '';
    //   }
    // } else {
    //   form['UploadForm[binarycontent]'] = data.primary.file;
    // }

    // this.checkCancelled(cancellationToken);
    // const post = await Http.post<string>(url, data.part.accountId, {
    //   type: 'multipart',
    //   data: form,
    //   headers: {
    //     referer: url,
    //   },
    // });

    // this.verifyResponse(post, 'Verify posted');
    // if (post.body.includes('edit')) {
    //   return this.createPostResponse({ source: post.returnUrl });
    // }

    // return Promise.reject(this.createPostResponse({ additionalInfo: post.body }));
  }

  async postNotificationSubmission(
    cancellationToken: CancellationToken,
    data: PostData<Submission, PillowfortNotificationOptions>,
  ): Promise<PostResponse> {
    const page = await Http.get<string>(`${this.BASE_URL}/posts/new`, data.part.accountId);
    this.verifyResponse(page, 'Get form page');

    const form: any = {
      authenticity_token: HtmlParserUtil.getInputValue(page.body, 'authenticity_token'),
      utf8: '✓',
      post_to: 'current_user',
      post_type: 'text',
      title: data.title,
      content: `<p>${data.description}</p>`,
      privacy: data.options.privacy,
      tags: this.formatTags(data.tags),
      commit: 'Submit',
    };

    if (data.options.allowReblogging) {
      form.rebloggable = 'on';
    }
    if (!data.options.allowComments) {
      form.commentable = 'on';
    }
    if (data.rating !== SubmissionRating.GENERAL) {
      form.nsfw = 'on';
    }

    this.checkCancelled(cancellationToken);
    const post = await Http.post<string>(`${this.BASE_URL}/posts/create`, data.part.accountId, {
      type: 'multipart',
      data: form,
    });

    this.verifyResponse(post, 'Verify post success');
    if (post.response.statusCode === 200) {
      return this.createPostResponse({});
    }

    return Promise.reject(this.createPostResponse({ additionalInfo: post.body }));
  }

  formatTags(tags: string[]) {
    return tags.join(', ');
  }

  validateFileSubmission(
    submission: FileSubmission,
    submissionPart: SubmissionPart<PillowfortFileOptions>,
    defaultPart: SubmissionPart<DefaultOptions>,
  ): ValidationParts {
    const problems: string[] = [];
    const warnings: string[] = [];
    const isAutoscaling: boolean = submissionPart.data.autoScale;

    if (!WebsiteValidator.supportsFileType(submission.primary, this.acceptsFiles)) {
      problems.push(
        `Does not support file format: (${submission.primary.name}) ${submission.primary.mimetype}.`,
      );
    }

    return { problems, warnings };
  }
}
