import { Injectable } from '@nestjs/common';
import * as cheerio from 'cheerio';
import _ = require('lodash');
import {
  DefaultFileOptions,
  DefaultOptions,
  FileRecord,
  FileSubmission,
  Folder,
  KoFiFileOptions,
  PostResponse,
  Submission,
  SubmissionPart,
  SubmissionRating,
  SubmissionType,
} from 'postybirb-commons';
import UserAccountEntity from 'src/server//account/models/user-account.entity';
import { PlaintextParser } from 'src/server/description-parsing/plaintext/plaintext.parser';
import Http from 'src/server/http/http.util';
import { CancellationToken } from 'src/server/submission/post/cancellation/cancellation-token';
import { FilePostData } from 'src/server/submission/post/interfaces/file-post-data.interface';
import { PostData } from 'src/server/submission/post/interfaces/post-data.interface';
import { ValidationParts } from 'src/server/submission/validator/interfaces/validation-parts.interface';
import HtmlParserUtil from 'src/server/utils/html-parser.util';
import WebsiteValidator from 'src/server/utils/website-validator.util';
import { GenericAccountProp } from '../generic/generic-account-props.enum';
import { LoginResponse } from '../interfaces/login-response.interface';
import { ScalingOptions } from '../interfaces/scaling-options.interface';
import { Website } from '../website.base';

@Injectable()
export class KoFi extends Website {
  readonly BASE_URL: string = 'https://ko-fi.com';
  readonly acceptsFiles: string[] = ['jpeg', 'jpg', 'png'];

  async checkLoginStatus(data: UserAccountEntity): Promise<LoginResponse> {
    const status: LoginResponse = { loggedIn: false, username: null };
    const res = await Http.get<string>(`${this.BASE_URL}/settings`, data._id);
    if (!res.body.includes('btn-login')) {
      status.loggedIn = true;
      status.username = HtmlParserUtil.getInputValue(res.body, 'DisplayName');
      this.storeAccountInformation(data._id, 'id', res.body.match(/pageId:\s'(.*?)'/)[1]);
      await this.getAlbums(res.body.match(/buttonId:\s'(.*?)'/)[1], data._id);
    }

    return status;
  }

  private async getAlbums(id: string, partition: string): Promise<void> {
    const { body } = await Http.get<string>(`${this.BASE_URL}/${id}/gallery`, partition);

    const albums: Folder[] = [];

    const $ = cheerio.load(body);
    $('.hz-album-each').each((i, el) => {
      const $el = $(el);
      const label = $el.text().trim();
      if (label !== 'New') {
        albums.push({
          label,
          value: $el
            .children('a')
            .attr('href')
            .split('/')
            .pop(),
        });
      }
    });

    this.storeAccountInformation(partition, GenericAccountProp.FOLDERS, albums);
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
    data: FilePostData<KoFiFileOptions>,
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
      Album: data.options.album || '',
      Title: data.title,
      Description: data.description,
      PostToTwitter: 'false',
      EnableHiRes: data.options.hiRes ? 'true' : 'false',
      ImageUploadIds: [json[0].ExternalId],
      Audience: data.options.audience || 'public',
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
    submissionPart: SubmissionPart<KoFiFileOptions>,
    defaultPart: SubmissionPart<DefaultOptions>,
  ): ValidationParts {
    const problems: string[] = [];
    const warnings: string[] = [];

    if (submissionPart.data.album) {
      const folders: Folder[] = _.get(
        this.accountInformation.get(submissionPart.accountId),
        GenericAccountProp.FOLDERS,
        [],
      );
      if (!folders.find(f => f.value === submissionPart.data.album)) {
        warnings.push(`Folder (${submissionPart.data.album}) not found.`);
      }
    }

    const rating: SubmissionRating | string = submissionPart.data.rating || defaultPart.data.rating;
    if (rating !== SubmissionRating.GENERAL) {
      problems.push(`Does not support rating: ${rating}`);
    }

    if (!WebsiteValidator.supportsFileType(submission.primary, this.acceptsFiles)) {
      problems.push(
        `Currently supported file formats: ${this.acceptsFiles.join(', ')}`,
      );
    }

    return { problems, warnings };
  }
}
