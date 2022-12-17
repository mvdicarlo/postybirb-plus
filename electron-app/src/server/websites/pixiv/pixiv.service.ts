import { Injectable, NotImplementedException } from '@nestjs/common';
import {
  DefaultOptions,
  FileRecord,
  FileSubmission,
  FileSubmissionType,
  PixivFileOptions,
  PostResponse,
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
import { LoginResponse } from '../interfaces/login-response.interface';
import { ScalingOptions } from '../interfaces/scaling-options.interface';
import { Website } from '../website.base';

@Injectable()
export class Pixiv extends Website {
  readonly BASE_URL = 'https://www.pixiv.net';
  readonly acceptsFiles = ['png', 'jpeg', 'jpg', 'gif'];
  readonly waitBetweenPostsInterval = 360000;
  readonly defaultDescriptionParser = PlaintextParser.parse;
  readonly acceptsAdditionalFiles = true;

  async checkLoginStatus(data: UserAccountEntity): Promise<LoginResponse> {
    const status: LoginResponse = { loggedIn: false, username: null };
    const res = await Http.get<string>(this.BASE_URL, data._id);
    const match = res.body.includes('signup-form');
    if (!match) {
      status.loggedIn = true;
      status.username = 'Logged In';
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

    const files = [data.thumbnail, data.primary.file, ...data.additional.map((f) => f.file)].filter(
      (f) => f,
    );

    const form: any = {
      tt: HtmlParserUtil.getInputValue(page.body, 'tt', 2),
      uptype: 'illust',
      x_restrict_sexual: this.getContentRating(data.rating),
      sexual: '',
      title: data.title.substring(0, 32),
      tag: this.formatTags(data.tags).slice(0, 10).join(' '),
      comment: data.description,
      rating: '1',
      mode: 'upload',
      suggested_tags: '',
      book_style: '0',
      restrict: '0',
      'quality[]': '',
      quality_text: '',
      qropen: '',
      ai_type: data.options.aiGenerated ? '2' : '1',
      'files[]': files,
      'file_info[]': files.map((f) =>
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
        options.matureContent.forEach((c) => (form[c] = 'on'));
      }
    }

    if (options.containsContent) {
      options.containsContent.forEach((c) => (form[c] = 'on'));
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
    submissionPart: SubmissionPart<PixivFileOptions>,
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
        (f) => !f.ignoredAccounts!.includes(submissionPart.accountId),
      ),
    ];

    if (submissionPart.data.aiGenerated === undefined) {
      problems.push('Please specify if the art is AI Generated.');
    }

    const maxMB: number = 32;
    files.forEach((file) => {
      const { type, size, name, mimetype } = file;
      if (FileSize.MBtoBytes(maxMB) < size) {
        if (!WebsiteValidator.supportsFileType(file, this.acceptsFiles)) {
          problems.push(`Does not support file format: (${name}) ${mimetype}.`);
        }
        if (
          isAutoscaling &&
          type === FileSubmissionType.IMAGE &&
          ImageManipulator.isMimeType(mimetype)
        ) {
          warnings.push(`${name} will be scaled down to ${maxMB}MB`);
        } else {
          problems.push(`Pixiv limits ${mimetype} to ${maxMB}MB`);
        }
      }
    });

    return { problems, warnings };
  }
}
