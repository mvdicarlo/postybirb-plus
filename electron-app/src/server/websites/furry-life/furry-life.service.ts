import { Injectable } from '@nestjs/common';
import cheerio from 'cheerio';
import {
  DefaultOptions,
  FileRecord,
  FileSubmission,
  FileSubmissionType,
  Folder,
  FurryLifeFileOptions,
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
import FormContent from 'src/server/utils/form-content.util';
import HtmlParserUtil from 'src/server/utils/html-parser.util';
import WebsiteValidator from 'src/server/utils/website-validator.util';
import { GenericAccountProp } from '../generic/generic-account-props.enum';
import { LoginResponse } from '../interfaces/login-response.interface';
import { ScalingOptions } from '../interfaces/scaling-options.interface';
import { Website } from '../website.base';

@Injectable()
export class FurryLife extends Website {
  readonly BASE_URL = 'https://furrylife.online';
  readonly acceptsFiles = ['jpeg', 'jpg', 'png', 'gif'];
  readonly acceptsAdditionalFiles = true;
  readonly PROP_ACCOUNT_ID: string = 'accountId';
  readonly SFW_ALBUM: string = 'general-sfw.712-sfw';
  readonly NSFW_ALBUM: string = 'explicit-nsfw.714-nsfw';

  async checkLoginStatus(data: UserAccountEntity): Promise<LoginResponse> {
    const status: LoginResponse = { loggedIn: false, username: null };
    const { body } = await Http.get<string>(`${this.BASE_URL}/account`, data._id);
    if (!body.includes('Log in')) {
      status.loggedIn = true;
      const $ = cheerio.load(body);
      status.username = $('.avatar').siblings('.p-navgroup-linkText').text();
      const accountProfileId = `${status.username}.${$('.avatar').attr('data-user-id')}`;
      this.storeAccountInformation(data._id, this.PROP_ACCOUNT_ID, accountProfileId);
      try {
        await this.loadAlbums(data._id, accountProfileId);
      } catch {
        this.logger.error('Unable to load albums');
      }
    }
    return status;
  }

  private async loadAlbums(profileId: string, accountId: string) {
    const { body } = await Http.get<string>(
      `${this.BASE_URL}/media/albums/users/${accountId}`,
      profileId,
    );
    const $ = cheerio.load(body);
    const albumUrls: string[] = [];
    $('a').each((i: number, el: any) => {
      if (
        el.attribs.href &&
        el.attribs.href.includes('media/albums') &&
        el.parentNode.attribs.class?.includes('itemList-item') &&
        !albumUrls.includes(el.attribs.href)
      ) {
        albumUrls.push(el.attribs.href);
      }
    });

    const data = await Promise.all<Folder>(
      albumUrls.map(async (albumUrl) => {
        const res = await Http.get<string>(`${this.BASE_URL}${albumUrl}`, profileId);
        const $$ = cheerio.load(res.body);
        const urlParts = albumUrl.split('/');
        urlParts.pop();
        const nsfw = !res.body.includes('general-sfw-albums.1');
        return {
          value: `${urlParts.pop()}-${nsfw ? 'nsfw' : 'sfw'}`,
          nsfw,
          label: $$('.p-title-value').text().trim(),
        };
      }),
    );

    const sfwFolder: Folder = {
      value: 'sfw',
      label: 'SFW',
      children: [
        {
          value: this.SFW_ALBUM,
          label: 'General (SFW)',
          nsfw: false,
        },
        ...data.filter((d) => !d.nsfw).sort((a, b) => a.label.localeCompare(b.label)),
      ],
    };

    const nsfwFolder: Folder = {
      value: 'nsfw',
      label: 'NSFW',
      children: [
        {
          value: this.NSFW_ALBUM,
          label: 'General (NSFW)',
          nsfw: true,
        },
        ...data.filter((d) => d.nsfw).sort((a, b) => a.label.localeCompare(b.label)),
      ],
    };

    this.storeAccountInformation(profileId, GenericAccountProp.FOLDERS, [sfwFolder, nsfwFolder]);
  }

  getScalingOptions(file: FileRecord): ScalingOptions {
    return { maxSize: FileSize.MBtoBytes(1023) };
  }

  parseDescription(text: string) {
    return text;
  }

  private async upload(
    profileId: string,
    token: string,
    url: string,
    file: PostFile,
  ): Promise<any> {
    const data = {
      _xfToken: token,
      _xfResponseType: 'json',
      _xfWithData: '1',
      flowChunkNumber: '1',
      flowChunkSize: '4294967296',
      flowCurrentChunkSize: file.value.length,
      flowCTotalSize: file.value.length,
      flowIdentifier: `${file.value.length}-${file.options.filename.replace('.', '')}`,
      flowFilename: file.options.filename,
      flowRelativePath: file.options.filename,
      flowTotalChunks: '1',
      upload: file,
    };

    const res = await Http.post<{ status: string; attachment: any; errors: any[] }>(
      url,
      profileId,
      {
        type: 'multipart',
        data,
        requestOptions: {
          json: true,
        },
      },
    );

    this.verifyResponse(res, 'Upload verify');

    if (res.body.status === 'ok') {
      return res.body.attachment;
    }

    return Promise.reject(
      this.createPostResponse({ message: Object.values(res.body.errors).join('\n') }),
    );
  }

  async postFileSubmission(
    cancellationToken: CancellationToken,
    data: FilePostData<FurryLifeFileOptions>,
  ): Promise<PostResponse> {
    const { options } = data;

    const albumParts = options.album.split('-');
    albumParts.pop();
    const album = albumParts.join('-');

    const isNotAlbum = options.album === this.SFW_ALBUM || options.album === this.NSFW_ALBUM;

    const files = [data.primary, ...data.additional].map((f) => f.file);

    await BrowserWindowUtil.getPage(
      data.part.accountId,
      `${this.BASE_URL}/media/${isNotAlbum ? 'categories' : 'albums'}/${album}/add`,
      false,
    );

    const { body } = await Http.get<string>(
      `${this.BASE_URL}/media/${isNotAlbum ? 'categories' : 'albums'}/${album}/add`,
      data.part.accountId,
    );

    const token = body.match(/data-csrf="(.*?)"/)[1];
    const href = `${this.BASE_URL}${
      body.match(/href="\/attachments\/upload\?type=(.*?)"/)[0].match(/"(.*?)"/)[1]
    }`.replace(/&amp;/g, '&');
    const hash = HtmlParserUtil.getInputValue(body, 'attachment_hash');
    const hashCombined = HtmlParserUtil.getInputValue(body, 'attachment_hash_combined').replace(
      /&quot;/g,
      '"',
    );

    this.checkCancelled(cancellationToken);
    try {
      const uploads = await Promise.all(
        files.map((file) => this.upload(data.part.accountId, token, href, file)),
      );

      const uploadData: any = {
        attachment_hash: hash,
        attachment_hash_combined: hashCombined,
        _xfToken: token,
        _xfRequestUri: `/media/${isNotAlbum ? 'categories' : 'albums'}/${album}/add`,
        _xfWithData: '1',
        _xfResponseType: 'json',
      };

      if (isNotAlbum) {
        uploadData.category_id = album.split('.').pop();
      } else {
        uploadData.album_id = album.split('.').pop();
      }

      uploads.forEach((u) => {
        const mediaId = `media[${u.temp_media_id}]`;
        uploadData[`${mediaId}[title]`] = data.title;
        uploadData[`${mediaId}[description]`] = '';
        uploadData[`${mediaId}[tags]`] = this.formatTags(data.tags).join(', ');
        uploadData[`${mediaId}[temp_media_id]`] = u.temp_media_id;
        uploadData[`${mediaId}[media_hash]`] = u.media_hash;
        uploadData[`${mediaId}[media_type]`] = u.type_grouping;
        uploadData[`${mediaId}[attachment_id]`] = u.attachment_id;
        uploadData[`${mediaId}[custom_fields][caption_html]`] = data.description;
        uploadData[`${mediaId}[custom_fields][artist]`] = data.options.credit || '';
        uploadData[`${mediaId}[custom_fields][artist_url]`] = '';
        uploadData[`${mediaId}[custom_fields][characters]`] = '';
      });

      const { body } = await Http.post<{ status: string; errors: any[]; redirect: string }>(
        `${this.BASE_URL}/media/save-media`,
        data.part.accountId,
        {
          type: 'multipart',
          data: uploadData,
          requestOptions: {
            json: true,
          },
        },
      );

      if (body.status === 'ok') {
        return this.createPostResponse({ source: body.redirect });
      } else {
        return Promise.reject(
          this.createPostResponse({ error: Object.values(body.errors).join('\n') }),
        );
      }
    } catch (err) {
      return Promise.reject(this.createPostResponse({ additionalInfo: err }));
    }
  }

  async postNotificationSubmission(
    cancellationToken: CancellationToken,
    data: PostData<Submission, DefaultOptions>,
  ): Promise<PostResponse> {
    await BrowserWindowUtil.getPage(data.part.accountId, this.BASE_URL, false);

    const { body } = await Http.get<string>(
      `${this.BASE_URL}/members/${this.getAccountInfo(data.part.accountId, this.PROP_ACCOUNT_ID)}`,
      data.part.accountId,
    );

    const hash = HtmlParserUtil.getInputValue(body, 'attachment_hash');
    const hashCombined = HtmlParserUtil.getInputValue(body, 'attachment_hash_combined').replace(
      /&quot;/g,
      '"',
    );

    const form = {
      _xfToken: body.match(/data-csrf="(.*?)"/)[1],
      message_html: data.description,
      _xfWithData: '1',
      _xfResponseType: 'json',
      _xfRequestUri: `/members/${this.getAccountInfo(data.part.accountId, this.PROP_ACCOUNT_ID)}`,
      attachment_hash: hash,
      attachment_hash_combined: hashCombined,
    };

    this.checkCancelled(cancellationToken);
    const post = await Http.post<{ status: string; errors: any[] }>(
      `${this.BASE_URL}/members/${this.getAccountInfo(
        data.part.accountId,
        this.PROP_ACCOUNT_ID,
      )}/post`,
      data.part.accountId,
      {
        type: 'multipart',
        data: form,
        requestOptions: {
          json: true,
        },
      },
    );

    if (post.body.status === 'ok') {
      return this.createPostResponse({});
    } else {
      return Promise.reject(
        this.createPostResponse({ error: Object.values(post.body.errors).join('\n') }),
      );
    }

    return Promise.reject(this.createPostResponse({ additionalInfo: post.body }));
  }

  validateFileSubmission(
    submission: FileSubmission,
    submissionPart: SubmissionPart<FurryLifeFileOptions>,
    defaultPart: SubmissionPart<DefaultOptions>,
  ): ValidationParts {
    const problems: string[] = [];
    const warnings: string[] = [];
    const isAutoscaling: boolean = submissionPart.data.autoScale;

    const folder = submissionPart.data.album;
    const rating = submissionPart.data.rating || defaultPart.data.rating;
    if (folder.endsWith('nsfw') && rating === SubmissionRating.GENERAL) {
      warnings.push('Potentially uploading NSFW to SFW Album');
    }

    if (
      !WebsiteValidator.folderIdExists(
        folder,
        this.getAccountInfo(submissionPart.accountId, GenericAccountProp.FOLDERS),
      )
    ) {
      warnings.push(`Album (${folder}) not found.`);
    }

    if (FormContent.getTags(defaultPart.data.tags, submissionPart.data.tags).length < 2) {
      problems.push('Requires at least 2 tags.');
    }

    const files = [
      submission.primary,
      ...(submission.additional || []).filter(
        (f) => !f.ignoredAccounts!.includes(submissionPart.accountId),
      ),
    ];

    const maxMB: number = 1023;
    files.forEach((file) => {
      const { type, size, name, mimetype } = file;
      if (!WebsiteValidator.supportsFileType(file, this.acceptsFiles)) {
        problems.push(`Does not support file format: (${name}) ${mimetype}.`);
      }
      if (FileSize.MBtoBytes(maxMB) < size) {
        if (
          isAutoscaling &&
          type === FileSubmissionType.IMAGE &&
          ImageManipulator.isMimeType(mimetype)
        ) {
          warnings.push(`${name} will be scaled down to ${maxMB}MB`);
        } else {
          problems.push(`FurryLife limits ${mimetype} to ${maxMB}MB`);
        }
      }
    });

    return { problems, warnings };
  }
}
