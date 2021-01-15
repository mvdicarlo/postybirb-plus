import { Injectable } from '@nestjs/common';
import * as FormData from 'form-data';
import {
  DefaultOptions,
  FileRecord,
  FileSubmission,
  FileSubmissionType,
  PillowfortFileOptions,
  PillowfortNotificationOptions,
  PostResponse,
  Submission,
  SubmissionPart,
  SubmissionRating,
} from 'postybirb-commons';
import UserAccountEntity from 'src/server//account/models/user-account.entity';
import ImageManipulator from 'src/server/file-manipulation/manipulators/image.manipulator';
import Http from 'src/server/http/http.util';
import { CancellationToken } from 'src/server/submission/post/cancellation/cancellation-token';
import {
  FilePostData,
  PostFile,
} from 'src/server/submission/post/interfaces/file-post-data.interface';
import { PostData } from 'src/server/submission/post/interfaces/post-data.interface';
import { ValidationParts } from 'src/server/submission/validator/interfaces/validation-parts.interface';
import BrowserWindowUtil from 'src/server/utils/browser-window.util';
import FileSize from 'src/server/utils/filesize.util';
import HtmlParserUtil from 'src/server/utils/html-parser.util';
import WebsiteValidator from 'src/server/utils/website-validator.util';
import { LoginResponse } from '../interfaces/login-response.interface';
import { ScalingOptions } from '../interfaces/scaling-options.interface';
import { Website } from '../website.base';

@Injectable()
export class Pillowfort extends Website {
  readonly BASE_URL = 'https://www.pillowfort.social';
  readonly acceptsAdditionalFiles = true;
  readonly acceptsFiles = ['png', 'jpeg', 'jpg', 'gif'];
  readonly usernameShortcuts = [
    {
      key: 'pf',
      url: 'https://www.pillowfort.social/$1',
    },
  ];

  async checkLoginStatus(data: UserAccountEntity): Promise<LoginResponse> {
    const status: LoginResponse = { loggedIn: false, username: null };
    const res = await Http.get<string>(this.BASE_URL, data._id);
    await BrowserWindowUtil.getPage(data._id, this.BASE_URL, false);
    if (res.body.includes('/signout')) {
      status.loggedIn = true;
      status.username = res.body.match(/value="current_user">(.*?)</)[1];
    }
    return status;
  }

  parseDescription(text: string) {
    return text;
  }

  getScalingOptions(file: FileRecord): ScalingOptions {
    return { maxSize: FileSize.MBtoBytes(10) };
  }

  private async uploadImage(
    photo: PostFile,
    profileId: string,
    auth: string,
  ): Promise<{ full_image: string; small_image: string }> {
    const upload = await Http.post<any>(`${this.BASE_URL}/image_upload`, profileId, {
      type: 'multipart',
      data: {
        file_name: photo.options.filename,
        photo,
      },
      requestOptions: { json: true },
      headers: {
        'X-CSRF-Token': auth,
      },
    });

    this.verifyResponse(upload, 'Image upload verify');
    return upload.body;
  }

  async postFileSubmission(
    cancellationToken: CancellationToken,
    data: FilePostData<PillowfortFileOptions>,
  ): Promise<PostResponse> {
    const page = await Http.get<string>(`${this.BASE_URL}/posts/new`, data.part.accountId);
    this.verifyResponse(page, 'Get form page');

    const form: any = {
      authenticity_token: HtmlParserUtil.getInputValue(page.body, 'authenticity_token'),
      utf8: '✓',
      post_to: 'current_user',
      post_type: 'picture',
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

    const uploads = await Promise.all(
      [data.primary, ...data.additional]
        .map(f => f.file)
        .map(f => this.uploadImage(f, data.part.accountId, form.authenticity_token)),
    );

    this.checkCancelled(cancellationToken);
    const post = await Http.post<string>(`${this.BASE_URL}/posts/create`, data.part.accountId, {
      type: 'function',
      data: (fd: FormData) => {
        Object.entries(form).forEach(([key, value]) => {
          fd.append(key, value);
        });

        uploads.forEach((upload, i) => {
          fd.append('picture[][pic_url]', upload.full_image);
          fd.append('picture[][small_image_url]', upload.small_image);
          fd.append('picture[][b2_lg_url]', '');
          fd.append('picture[][b2_sm_url]', '');
          fd.append('picture[][row]', `${i + 1}`);
          fd.append('picture[][col]', '0');
        });
      },
    });

    this.verifyResponse(post, 'Verify post success');
    if (post.response.statusCode === 200) {
      return this.createPostResponse({});
    }

    return Promise.reject(this.createPostResponse({ additionalInfo: post.body }));
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

    const { type, size, name } = submission.primary;
    const maxMB: number = 10;
    if (FileSize.MBtoBytes(maxMB) < size) {
      if (
        isAutoscaling &&
        type === FileSubmissionType.IMAGE &&
        ImageManipulator.isMimeType(submission.primary.mimetype)
      ) {
        warnings.push(`${name} will be scaled down to ${maxMB}MB`);
      } else {
        problems.push(`Pillowfort limits ${submission.primary.mimetype} to ${maxMB}MB`);
      }
    }

    return { problems, warnings };
  }
}
