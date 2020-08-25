import { Injectable } from '@nestjs/common';
import UserAccountEntity from 'src/server//account/models/user-account.entity';
import { PlaintextParser } from 'src/server/description-parsing/plaintext/plaintext.parser';
import Http from 'src/server/http/http.util';
import { SubmissionRating } from 'src/server/submission/enums/submission-rating.enum';
import { FileRecord } from 'src/server/submission/file-submission/interfaces/file-record.interface';
import { FileSubmission } from 'src/server/submission/file-submission/interfaces/file-submission.interface';
import { Submission } from 'src/server/submission/interfaces/submission.interface';
import { CancellationToken } from 'src/server/submission/post/cancellation/cancellation-token';
import { FilePostData } from 'src/server/submission/post/interfaces/file-post-data.interface';
import { PostData } from 'src/server/submission/post/interfaces/post-data.interface';
import { PostResponse } from 'src/server/submission/post/interfaces/post-response.interface';
import {
  DefaultFileOptions,
  DefaultOptions,
} from 'src/server/submission/submission-part/interfaces/default-options.interface';
import { SubmissionPart } from 'src/server/submission/submission-part/interfaces/submission-part.interface';
import { ValidationParts } from 'src/server/submission/validator/interfaces/validation-parts.interface';
import HtmlParserUtil from 'src/server/utils/html-parser.util';
import WebsiteValidator from 'src/server/utils/website-validator.util';
import { GenericDefaultFileOptions } from '../generic/generic.defaults';
import { LoginResponse } from '../interfaces/login-response.interface';
import { ScalingOptions } from '../interfaces/scaling-options.interface';
import { Website } from '../website.base';
import { SubmissionType } from 'src/server/submission/enums/submission-type.enum';

@Injectable()
export class KoFi extends Website {
  readonly BASE_URL: string = 'https://ko-fi.com';
  readonly acceptsFiles: string[] = ['jpeg', 'jpg', 'png'];
  readonly fileSubmissionOptions: object = GenericDefaultFileOptions;

  async checkLoginStatus(data: UserAccountEntity): Promise<LoginResponse> {
    const status: LoginResponse = { loggedIn: false, username: null };
    const res = await Http.get<string>(`${this.BASE_URL}/settings`, data._id);
    if (!res.body.includes('btn-login')) {
      status.loggedIn = true;
      status.username = HtmlParserUtil.getInputValue(res.body, 'DisplayName');
      this.storeAccountInformation(data._id, 'id', res.body.match(/pageId:\s'(.*?)'/)[1]);
    }

    return status;
  }

  getScalingOptions(file: FileRecord): ScalingOptions | undefined {
    return undefined;
  }

  parseDescription(text: string) {
    return text;
  }

  postParseDescription(text: string, type: SubmissionType) {
    return type === SubmissionType.FILE
      ? PlaintextParser.parse(
          text.replace(
            '<p><a href="http://www.postybirb.com">Posted using PostyBirb</a></p>',
            'Posted using PostyBirb',
          ),
        )
      : text;
  }

  async postFileSubmission(
    cancellationToken: CancellationToken,
    data: FilePostData<DefaultFileOptions>,
  ): Promise<PostResponse> {
    const form = {
      uniqueFilename: '',
      file: data.primary.file,
    };

    this.checkCancelled(cancellationToken);
    const upload = await Http.post<string>(
      `${this.BASE_URL}/api/media/gallery-item/upload`,
      data.part.accountId,
      {
        type: 'multipart',
        data: form,
        headers: {
          Referer: 'https://ko-fi.com/',
        },
      },
    );

    this.verifyResponse(upload, 'After upload attempt');

    let json = null;
    try {
      json = JSON.parse(upload.body);
    } catch (err) {
      return Promise.reject(this.createPostResponse({ error: err, additionalInfo: upload.body }));
    }

    const id = this.getAccountInfo(data.part.accountId, 'id');
    const formUpdate: any = {
      Album: '',
      Title: data.title,
      Description: data.description,
      PostToTwitter: 'false',
      EnableHiRes: 'false',
      ImageUploadIds: [json[0].ExternalId],
    };

    this.checkCancelled(cancellationToken);
    const postResponse = await Http.post(
      `${this.BASE_URL}/Feed/AddImageFeedItem`,
      data.part.accountId,
      {
        type: 'multipart',
        data: formUpdate,
        requestOptions: { gzip: true },
        headers: {
          'Accept-Encoding': 'gzip, deflate, br',
          Accept: 'text/html, */*',
          Pragma: 'no-cache',
          'Cache-Control': 'no-cache',
          Referer: 'https://ko-fi.com/',
          Connection: 'keep-alive',
        },
      },
    );

    this.verifyResponse(postResponse, 'Post Update');
    return this.createPostResponse({});
  }

  async postNotificationSubmission(
    cancellationToken: CancellationToken,
    data: PostData<Submission, DefaultOptions>,
  ): Promise<PostResponse> {
    const form = {
      type: '',
      blogPostId: '',
      blogPostTitle: data.title,
      postBody: data.description,
      featuredImage: '',
      noFeaturedImage: 'false',
      showFeaturedImageOnPost: 'true',
      embedUrl: '',
      tags: this.formatTags(data.tags),
      postAudience: 'public',
    };

    this.checkCancelled(cancellationToken);
    const postResponse = await Http.post<string>(
      `${this.BASE_URL}/Blog/AddBlogPost`,
      data.part.accountId,
      {
        type: 'multipart',
        data: form,
        headers: {
          Accept: 'text/html,application/xhtml+xml,application/xml;',
          Pragma: 'no-cache',
          'Cache-Control': 'no-cache',
          Referer: 'https://ko-fi.com/',
          Connection: 'keep-alive',
        },
      },
    );

    this.verifyResponse(postResponse, 'AddBlogPost');

    const postUrl = (postResponse.body.match(/\/Blog\/PublishPost\/\d+/) || [])[0];
    if (!postUrl) {
      return Promise.reject(
        this.createPostResponse({
          message: 'Unable to detect a posting Url',
          additionalInfo: postResponse.body,
        }),
      );
    }

    this.checkCancelled(cancellationToken);
    const publish = await Http.post(`${this.BASE_URL}${postUrl}`, data.part.accountId, {
      requestOptions: { gzip: true },
      headers: {
        'Accept-Encoding': 'gzip, deflate, br',
        Accept: '*/*',
        Pragma: 'no-cache',
        'Cache-Control': 'no-cache',
        Referer: 'https://ko-fi.com/',
        Connection: 'keep-alive',
      },
    });

    this.verifyResponse(publish, 'Validate Publish');

    return this.createPostResponse({});
  }

  formatTags(tags: string[]) {
    return super.formatTags(tags).join(',');
  }

  validateFileSubmission(
    submission: FileSubmission,
    submissionPart: SubmissionPart<DefaultFileOptions>,
    defaultPart: SubmissionPart<DefaultOptions>,
  ): ValidationParts {
    const problems: string[] = [];
    const warnings: string[] = [];

    const rating: SubmissionRating = submissionPart.data.rating || defaultPart.data.rating;
    if (rating !== SubmissionRating.GENERAL) {
      problems.push(`Does not support rating: ${rating}`);
    }

    if (!WebsiteValidator.supportsFileType(submission.primary, this.acceptsFiles)) {
      problems.push(
        `Does not support file format: (${submission.primary.name}) ${submission.primary.mimetype}.`,
      );
    }

    return { problems, warnings };
  }
}
