import { Injectable } from '@nestjs/common';
import { Website } from '../website.base';
import UserAccountEntity from 'src/account/models/user-account.entity';
import { LoginResponse } from '../interfaces/login-response.interface';
import { GenericDefaultFileOptions } from '../generic/generic.defaults';
import Http from 'src/http/http.util';
import HtmlParserUtil from 'src/utils/html-parser.util';
import {
  DefaultFileOptions,
  DefaultOptions,
} from 'src/submission/submission-part/interfaces/default-options.interface';
import { FileSubmission } from 'src/submission/file-submission/interfaces/file-submission.interface';
import { SubmissionPart } from 'src/submission/submission-part/interfaces/submission-part.interface';
import { ValidationParts } from 'src/submission/validator/interfaces/validation-parts.interface';
import WebsiteValidator from 'src/utils/website-validator.util';
import { FilePostData } from 'src/submission/post/interfaces/file-post-data.interface';
import { PostResponse } from 'src/submission/post/interfaces/post-response.interface';
import { PostData } from 'src/submission/post/interfaces/post-data.interface';
import { Submission } from 'src/submission/interfaces/submission.interface';
import { FileRecord } from 'src/submission/file-submission/interfaces/file-record.interface';
import { ScalingOptions } from '../interfaces/scaling-options.interface';
import { SubmissionRating } from 'src/submission/enums/submission-rating.enum';
import { PlaintextParser } from 'src/description-parsing/plaintext/plaintext.parser';

@Injectable()
export class KoFi extends Website {
  readonly BASE_URL: string = 'https://ko-fi.com';
  readonly acceptsFiles: string[] = ['jpeg', 'jpg', 'png'];
  readonly fileSubmissionOptions: object = GenericDefaultFileOptions;

  async checkLoginStatus(data: UserAccountEntity): Promise<LoginResponse> {
    const status: LoginResponse = { loggedIn: false, username: null };
    const res = await Http.get<string>(`${this.BASE_URL}/settings`, data._id);
    if (!res.body.includes('Start a Page')) {
      status.loggedIn = true;
      status.username = HtmlParserUtil.getInputValue(res.body, 'DisplayName');
      this.storeAccountInformation(data._id, 'id', res.body.match(/pageId:\s'(.*?)'/)[1]);
    }

    return status;
  }

  getScalingOptions(file: FileRecord): ScalingOptions | undefined {
    return undefined;
  }

  parseDescription(text: string): string {
    return text; // no parsing
  }

  async postFileSubmission(data: FilePostData<DefaultFileOptions>): Promise<PostResponse> {
    const form = {
      uniqueFilename: '',
      file: data.primary.file,
    };

    const upload = await Http.post<string>(
      `${this.BASE_URL}/Media/UploadImage`,
      data.part.accountId,
      {
        type: 'multipart',
        data: form,
        headers: {
          Accept: 'application/json',
          Pragma: 'no-cache',
          'Cache-Control': 'no-cache',
          Referer: 'https://ko-fi.com/',
          Connection: 'keep-alive',
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
      Description: PlaintextParser.parse(data.description),
      PostToTwitter: 'false',
      EnableHiRes: 'false',
      FileNames: json.FileNames,
    };

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
