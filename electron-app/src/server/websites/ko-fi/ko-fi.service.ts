import { Injectable } from '@nestjs/common';
import cheerio from 'cheerio';
import {
  DefaultOptions,
  FileRecord,
  FileSubmission,
  Folder,
  KoFiFileOptions,
  PostResponse,
  SubmissionPart,
  SubmissionRating,
  SubmissionType,
} from 'postybirb-commons';
import UserAccountEntity from 'src/server//account/models/user-account.entity';
import { PlaintextParser } from 'src/server/description-parsing/plaintext/plaintext.parser';
import Http from 'src/server/http/http.util';
import { CancellationToken } from 'src/server/submission/post/cancellation/cancellation-token';
import { FilePostData } from 'src/server/submission/post/interfaces/file-post-data.interface';
import { ValidationParts } from 'src/server/submission/validator/interfaces/validation-parts.interface';
import BrowserWindowUtil from 'src/server/utils/browser-window.util';
import HtmlParserUtil from 'src/server/utils/html-parser.util';
import WebsiteValidator from 'src/server/utils/website-validator.util';
import { GenericAccountProp } from '../generic/generic-account-props.enum';
import { LoginResponse } from '../interfaces/login-response.interface';
import { ScalingOptions } from '../interfaces/scaling-options.interface';
import { Website } from '../website.base';
import _ from 'lodash';

@Injectable()
export class KoFi extends Website {
  readonly BASE_URL: string = 'https://ko-fi.com';
  readonly acceptsFiles: string[] = ['jpeg', 'jpg', 'png', 'gif'];
  readonly acceptsAdditionalFiles: boolean = true;

  async checkLoginStatus(data: UserAccountEntity): Promise<LoginResponse> {
    const status: LoginResponse = { loggedIn: false, username: null };
    // const res = await Http.get<string>(`${this.BASE_URL}`, data._id);
    const body = await BrowserWindowUtil.getPage(data._id, `${this.BASE_URL}/settings`, true); //Bypass captcha check
    if (!body.includes('btn-login')) {
      status.loggedIn = true;
      status.username = HtmlParserUtil.getInputValue(body, 'DisplayName');
      this.storeAccountInformation(data._id, 'id', body.match(/pageId:\s'(.*?)'/)[1]);
      await this.getAlbums(body.match(/buttonId:\s'(.*?)'/)[1], data._id);
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
          value: $el.children('a').attr('href').split('/').pop(),
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
    this.checkCancelled(cancellationToken);

    const imageUploadIds = [];
    let body = null;
    try {
      const filesToPost = [data.primary, ...data.additional].slice(0, 8);
      for (const fileRecord of filesToPost) {
        const upload = await Http.post<string>(
          `${this.BASE_URL}/api/media/gallery-item/upload?throwOnError=true`,
          data.part.accountId,
          {
            type: 'multipart',
            data: {
              filenames: fileRecord.file.options.filename,
              'file[0]': fileRecord.file,
            },
          },
        );

        body = upload.body;
        const json = JSON.parse(upload.body);
        imageUploadIds.push(json[0].ExternalId);
      }
    } catch (err) {
      return Promise.reject(this.createPostResponse({ message: err, additionalInfo: body }));
    }

    this.checkCancelled(cancellationToken);
    const post = await Http.post<{ success: boolean }>(
      `${this.BASE_URL}/Gallery/AddGalleryItem`,
      data.part.accountId,
      {
        type: 'json',
        data: {
          Album: data.options.album || '',
          Audience: data.options.audience,
          Description: data.description,
          EnableHiRes: data.options.hiRes || false,
          GalleryItemId: '',
          ImageUploadIds: imageUploadIds,
          PostToTwitter: false,
          ScheduleEnabled: false,
          Title: data.title,
          UploadAsIndividualImages: false,
        },
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

    let json = post.body || { success: false };
    if (!json.success) {
      return Promise.reject(
        this.createPostResponse({
          message: 'Unknown error when posting',
          additionalInfo: post.body,
        }),
      );
    }

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
      if (!folders.find((f) => f.value === submissionPart.data.album)) {
        warnings.push(`Folder (${submissionPart.data.album}) not found.`);
      }
    }

    const rating: SubmissionRating | string = submissionPart.data.rating || defaultPart.data.rating;
    if (rating !== SubmissionRating.GENERAL) {
      problems.push(`Does not support rating: ${rating}`);
    }

    if (!WebsiteValidator.supportsFileType(submission.primary, this.acceptsFiles)) {
      problems.push(`Currently supported file formats: ${this.acceptsFiles.join(', ')}`);
    }

    return { problems, warnings };
  }
}
