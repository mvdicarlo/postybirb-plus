import { Injectable, NotImplementedException } from '@nestjs/common';
import { Website } from '../website.base';
import { GenericDefaultFileOptions } from '../generic/generic.defaults';
import UserAccountEntity from 'src/account/models/user-account.entity';
import { LoginResponse } from '../interfaces/login-response.interface';
import Http from 'src/http/http.util';
import HtmlParserUtil from 'src/utils/html-parser.util';
import FileSize from 'src/utils/filesize.util';
import { FileRecord } from 'src/submission/file-submission/interfaces/file-record.interface';
import { ScalingOptions } from '../interfaces/scaling-options.interface';
import { PlaintextParser } from 'src/description-parsing/plaintext/plaintext.parser';
import { FilePostData } from 'src/submission/post/interfaces/file-post-data.interface';
import {
  DefaultFileOptions,
  DefaultOptions,
} from 'src/submission/submission-part/interfaces/default-options.interface';
import { PostResponse } from 'src/submission/post/interfaces/post-response.interface';
import { FileSubmission } from 'src/submission/file-submission/interfaces/file-submission.interface';
import { SubmissionPart } from 'src/submission/submission-part/interfaces/submission-part.interface';
import { ValidationParts } from 'src/submission/validator/interfaces/validation-parts.interface';
import { SubmissionRating } from 'src/submission/enums/submission-rating.enum';
import WebsiteValidator from 'src/utils/website-validator.util';
import { FileSubmissionType } from 'src/submission/file-submission/enums/file-submission-type.enum';
import ImageManipulator from 'src/file-manipulation/manipulators/image.manipulator';
import { PostData } from 'src/submission/post/interfaces/post-data.interface';
import { Submission } from 'src/submission/interfaces/submission.interface';

@Injectable()
export class Route50 extends Website {
  readonly BASE_URL = 'http://route50.net';
  readonly acceptsFiles = ['jpg', 'png', 'gif', 'txt', 'mp3', 'midi', 'swf'];
  readonly fileSubmissionOptions = GenericDefaultFileOptions;
  readonly defaultDescriptionParser = PlaintextParser.parse;

  async checkLoginStatus(data: UserAccountEntity): Promise<LoginResponse> {
    const status: LoginResponse = { loggedIn: false, username: null };
    const res = await Http.get<string>(this.BASE_URL, data._id);
    if (res.body.includes('loggedin')) {
      status.loggedIn = true;
      status.username = res.body.match(/class="dispavatar" title="(.*?)"/)[1];
    }

    return status;
  }

  getScalingOptions(file: FileRecord): ScalingOptions | undefined {
    return { maxSize: FileSize.MBtoBytes(10) };
  }

  private getCategory(type: FileSubmissionType) {
    switch (type) {
      case FileSubmissionType.VIDEO:
        return '12';
      case FileSubmissionType.TEXT:
        return '14';
      case FileSubmissionType.AUDIO:
        return '15';
      case FileSubmissionType.IMAGE:
      default:
        return '9';
    }
  }

  private getContentType(type: FileSubmissionType) {
    switch (type) {
      case FileSubmissionType.VIDEO:
        return 'flash';
      case FileSubmissionType.TEXT:
        return 'text';
      case FileSubmissionType.AUDIO:
        return 'audio';
      case FileSubmissionType.IMAGE:
      default:
        return 'image';
    }
  }

  async postFileSubmission(data: FilePostData<DefaultFileOptions>): Promise<PostResponse> {
    const form: any = {
      title: data.title,
      file: data.primary.file,
      thumbnail: data.thumbnail,
      category: this.getCategory(data.primary.type),
      type: this.getContentType(data.primary.type),
      tags: this.formatTags(data.tags),
      description: data.description,
      swf_width: '',
      swf_height: '',
      minidesc: '',
      enableComments: '1',
      tos: '1',
      coc: '1',
    };

    if (data.primary.type === FileSubmissionType.TEXT) {
      if (!WebsiteValidator.supportsFileType(data.submission.primary, this.acceptsFiles)) {
        form.file = data.fallback;
      }
    }

    const post = await Http.post<string>(`${this.BASE_URL}/galleries/submit`, data.part.accountId, {
      type: 'multipart',
      data: form,
    });

    if (!post.body.includes('comment-container')) {
      return Promise.reject(this.createPostResponse({ additionalInfo: post.body }));
    }
    return this.createPostResponse({ source: post.returnUrl });
  }

  async postNotificationSubmission(
    data: PostData<Submission, DefaultOptions>,
  ): Promise<PostResponse> {
    throw new NotImplementedException('Method not implemented');
  }

  formatTags(tags: string[]) {
    return super.formatTags(tags).join(' ');
  }

  validateFileSubmission(
    submission: FileSubmission,
    submissionPart: SubmissionPart<DefaultFileOptions>,
    defaultPart: SubmissionPart<DefaultOptions>,
  ): ValidationParts {
    const problems: string[] = [];
    const warnings: string[] = [];
    const isAutoscaling: boolean = submissionPart.data.autoScale;

    const rating: SubmissionRating = submissionPart.data.rating || defaultPart.data.rating;
    if (rating !== SubmissionRating.GENERAL) {
      problems.push(`Does not support rating: ${rating}`);
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
    let maxMB: number = 10;
    if (FileSize.MBtoBytes(maxMB) < size) {
      if (
        isAutoscaling &&
        type === FileSubmissionType.IMAGE &&
        ImageManipulator.isMimeType(submission.primary.mimetype)
      ) {
        warnings.push(`${name} will be scaled down to ${maxMB}MB`);
      } else {
        problems.push(`Route 50 limits ${submission.primary.mimetype} to ${maxMB}MB`);
      }
    }

    return { problems, warnings };
  }
}
