import { Injectable, NotImplementedException } from '@nestjs/common';
import { Website } from '../website.base';
import { PlaintextParser } from 'src/description-parsing/plaintext/plaintext.parser';
import { FileRecord } from 'src/submission/file-submission/interfaces/file-record.interface';
import { ScalingOptions } from '../interfaces/scaling-options.interface';
import FileSize from 'src/utils/filesize.util';
import UserAccountEntity from 'src/account/models/user-account.entity';
import { LoginResponse } from '../interfaces/login-response.interface';
import Http from 'src/http/http.util';
import { PixivDefaultFileOptions } from './pixiv.defaults';
import { PixivFileOptions } from './pixiv.interface';
import { CancellationToken } from 'src/submission/post/cancellation/cancellation-token';
import { PostData } from 'src/submission/post/interfaces/post-data.interface';
import { Submission } from 'src/submission/interfaces/submission.interface';
import { DefaultOptions } from 'src/submission/submission-part/interfaces/default-options.interface';
import { PostResponse } from 'src/submission/post/interfaces/post-response.interface';
import { FilePostData } from 'src/submission/post/interfaces/file-post-data.interface';
import { FileSubmission } from 'src/submission/file-submission/interfaces/file-submission.interface';
import { SubmissionPart } from 'src/submission/submission-part/interfaces/submission-part.interface';
import { ValidationParts } from 'src/submission/validator/interfaces/validation-parts.interface';
import FormContent from 'src/utils/form-content.util';
import { FileSubmissionType } from 'src/submission/file-submission/enums/file-submission-type.enum';
import ImageManipulator from 'src/file-manipulation/manipulators/image.manipulator';
import HtmlParserUtil from 'src/utils/html-parser.util';
import { SubmissionRating } from 'src/submission/enums/submission-rating.enum';
import WebsiteValidator from 'src/utils/website-validator.util';

@Injectable()
export class Pixiv extends Website {
  readonly BASE_URL = 'https://www.pixiv.net';
  readonly acceptsFiles = ['png', 'jpeg', 'jpg', 'gif'];
  readonly waitBetweenPostsInterval = 360000;
  readonly defaultDescriptionParser = PlaintextParser.parse;
  readonly fileSubmissionOptions = PixivDefaultFileOptions;
  readonly acceptsAdditionalFiles = true;

  async checkLoginStatus(data: UserAccountEntity): Promise<LoginResponse> {
    const status: LoginResponse = { loggedIn: false, username: null };
    const res = await Http.get<string>(this.BASE_URL, data._id);
    const match = res.body.match(/"name":"(.*?)"/);
    if (match && match[1]) {
      status.loggedIn = true;
      status.username = match[1];
    }
    return status;
  }

  getScalingOptions(file: FileRecord): ScalingOptions {
    return { maxSize: FileSize.MBtoBytes(32) };
  }

  async postNotificationSubmission(
    cancellationToken: CancellationToken,
    data: PostData<Submission, DefaultOptions>,
  ): Promise<PostResponse> {
    throw new NotImplementedException('Method not implemented');
  }

  async postFileSubmission(
    cancellationToken: CancellationToken,
    data: FilePostData<PixivFileOptions>,
  ): Promise<PostResponse> {
    const page = await Http.get<string>(`${this.BASE_URL}/upload.php`, data.part.accountId);
    this.verifyResponse(page, 'Get page');

    const files = [data.thumbnail, data.primary.file, ...data.additional.map(f => f.file)].filter(
      f => f,
    );

    const form: any = {
      tt: HtmlParserUtil.getInputValue(page.body, 'tt', 2),
      uptype: 'illust',
      x_restrict_sexual: this.getContentRating(data.rating),
      sexual: '',
      title: data.title.substring(0, 32),
      tag: this.formatTags(data.tags).slice(0, 10),
      comment: data.description,
      rating: '1',
      mode: 'upload',
      suggested_tags: '',
      book_style: '0',
      restrict: '0',
      'quality[]': '',
      quality_text: '',
      qropen: '',
      'files[]': files,
      'file_info[]': files.map(f =>
        JSON.stringify({
          name: f.options.filename,
          type: f.options.contentType,
          size: f.value.length,
        }),
      ),
    };

    const { options } = data;
    if (!options.communityTags) form.taglock = '1';
    if (options.original) form.original = 'on';

    const sexualType = form.x_restrict_sexual;
    if (sexualType === '0') {
      if (options.sexual) form.sexual = 'implicit';
    } else {
      if (options.matureContent) {
        options.matureContent.forEach(c => (form[c] = 'on'));
      }
    }

    if (options.containsContent) {
      options.containsContent.forEach(c => (form[c] = 'on'));
    }

    this.checkCancelled(cancellationToken);
    const post = await Http.post<string>(`${this.BASE_URL}/upload.php`, data.part.accountId, {
      type: 'multipart',
      data: form,
      requestOptions: { qsStringifyOptions: { arrayFormat: 'repeat' } },
    });

    try {
      const json = JSON.parse(post.body);
      if (!json.error) {
        return this.createPostResponse({});
      } else {
        return Promise.reject(
          this.createPostResponse({
            additionalInfo: post.body,
            message: JSON.stringify(json.error),
          }),
        );
      }
    } catch {}
    return Promise.reject(this.createPostResponse({ additionalInfo: post.body }));
  }

  private getContentRating(rating: SubmissionRating) {
    switch (rating) {
      case SubmissionRating.ADULT:
      case SubmissionRating.MATURE:
        return '1';
      case SubmissionRating.EXTREME:
        return '2';
      case SubmissionRating.GENERAL:
      default:
        return '0';
    }
  }

  validateFileSubmission(
    submission: FileSubmission,
    submissionPart: SubmissionPart<any>,
    defaultPart: SubmissionPart<DefaultOptions>,
  ): ValidationParts {
    const problems: string[] = [];
    const warnings: string[] = [];
    const isAutoscaling: boolean = submissionPart.data.autoScale;

    const title = submissionPart.data.title || defaultPart.data.title || submission.title;
    if (title.length > 32) {
      warnings.push(`Title will be truncated to 32 characters: ${title.substring(0, 32)}`);
    }

    if (FormContent.getTags(defaultPart.data.tags, submissionPart.data.tags).length < 1) {
      problems.push('Requires at least 1 tag.');
    }

    const files = [
      submission.primary,
      ...(submission.additional || []).filter(
        f => !f.ignoredAccounts!.includes(submissionPart.accountId),
      ),
    ];

    const maxMB: number = 32;
    files.forEach(file => {
      const { type, size, name, mimetype } = file;
      if (FileSize.MBtoBytes(maxMB) < size) {
        if (
          isAutoscaling &&
          type === FileSubmissionType.IMAGE &&
          ImageManipulator.isMimeType(mimetype)
        ) {
          warnings.push(`${name} will be scaled down to ${maxMB}MB`);
        } else {
          problems.push(`Pixiv limits ${mimetype} to ${maxMB}MB`);
        }

        if (!WebsiteValidator.supportsFileType(file, this.acceptsFiles)) {
          problems.push(`Does not support file format: (${name}) ${mimetype}.`);
        }
      }
    });

    return { problems, warnings };
  }
}
