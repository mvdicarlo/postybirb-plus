import { Injectable } from '@nestjs/common';
import _ from 'lodash';
import {
  DefaultOptions,
  DeviantArtAccountData,
  DeviantArtFileOptions,
  FileRecord,
  FileSubmission,
  FileSubmissionType,
  Folder,
  PostResponse,
  Submission,
  SubmissionPart,
  SubmissionRating,
} from 'postybirb-commons';
import UserAccountEntity from 'src/server//account/models/user-account.entity';
import ImageManipulator from 'src/server/file-manipulation/manipulators/image.manipulator';
import Http from 'src/server/http/http.util';
import { CancellationToken } from 'src/server/submission/post/cancellation/cancellation-token';
import { FilePostData } from 'src/server/submission/post/interfaces/file-post-data.interface';
import { PostData } from 'src/server/submission/post/interfaces/post-data.interface';
import { ValidationParts } from 'src/server/submission/validator/interfaces/validation-parts.interface';
import BrowserWindowUtil from 'src/server/utils/browser-window.util';
import FileSize from 'src/server/utils/filesize.util';
import FormContent from 'src/server/utils/form-content.util';
import { HttpExperimental } from 'src/server/utils/http-experimental';
import WebsiteValidator from 'src/server/utils/website-validator.util';
import { GenericAccountProp } from '../generic/generic-account-props.enum';
import { LoginResponse } from '../interfaces/login-response.interface';
import { ScalingOptions } from '../interfaces/scaling-options.interface';
import { Website } from '../website.base';

interface DeviantArtFolder {
  description: string;
  folderId: string;
  hasSubfolders: boolean;
  name: string;
  parentId: string | null;
  gallectionUuid: string;
}

@Injectable()
export class DeviantArt extends Website {
  readonly BASE_URL = 'https://www.deviantart.com';
  readonly MAX_CHARS: number = undefined; // No Limit
  readonly acceptsFiles = [
    'jpeg',
    'jpg',
    'png',
    'bmp',
    'flv',
    'txt',
    'rtf',
    'odt',
    'swf',
    'tiff',
    'tif',
    'gif',
  ];
  readonly usernameShortcuts = [
    {
      key: 'da',
      url: 'https://deviantart.com/$1',
    },
  ];
  private readonly MAX_TAGS = 30;

  async checkLoginStatus(data: UserAccountEntity): Promise<LoginResponse> {
    const status: LoginResponse = { loggedIn: false, username: null };
    const res = await HttpExperimental.get<string>(this.BASE_URL, { partition: data._id });
    const cookies = await Http.getWebsiteCookies(data._id, this.BASE_URL);
    const userInfoCookie = cookies.find(c => c.name === 'userinfo');
    if (userInfoCookie) {
      status.loggedIn = true;
      status.username = JSON.parse(decodeURIComponent(userInfoCookie.value).split(';')[1]).username;
      await this.getFolders(data._id, status.username);
    }

    return status;
  }

  private async getFolders(profileId: string, username: string) {
    try {
      const csrf = await this.getCSRF(profileId);
      const res = await HttpExperimental.get<{ results: DeviantArtFolder[] }>(
        `${
          this.BASE_URL
        }/_puppy/dashared/gallection/folders?offset=0&limit=250&type=gallery&with_all_folder=true&with_permissions=true&username=${encodeURIComponent(
          username,
        )}&da_minor_version=20230710&csrf_token=${csrf}`,
        { partition: profileId },
      );
      const folders: Folder[] = [];
      res.body.results.forEach((f: DeviantArtFolder) => {
        const { parentId } = f;
        let label = f.name;
        if (parentId) {
          const parent = folders.find(r => r.value === parentId);
          if (parent) {
            label = `${parent.label} / ${label}`;
          }
        }
        folders.push({ value: f.folderId, label });
      });
      this.storeAccountInformation(profileId, GenericAccountProp.FOLDERS, folders);
    } catch (e) {
      console.error(e);
    }
  }

  getScalingOptions(file: FileRecord): ScalingOptions {
    return { maxSize: FileSize.MBtoBytes(30) };
  }

  formatTags(tags: string[]): string[] {
    tags = super.parseTags(tags);
    if (tags.length > this.MAX_TAGS) {
      return tags.slice(0, this.MAX_TAGS - 1);
    } else return tags;
  }

  private async getCSRF(profileId: string) {
    const url = await HttpExperimental.get<string>(this.BASE_URL, { partition: profileId });
    return url.body.match(/window.__CSRF_TOKEN__ = '(.*)'/)?.[1];
  }

  async postFileSubmission(
    cancellationToken: CancellationToken,
    data: FilePostData<DeviantArtFileOptions>,
    accountData: DeviantArtAccountData,
  ): Promise<PostResponse> {
    const fileUpload = await HttpExperimental.post<{
      deviationId: number;
      status: string;
      stashId: number;
      privateId: number;
      size: number;
      cursor: string;
      title: string;
    }>(`${this.BASE_URL}/_puppy/dashared/deviation/submit/upload/deviation`, {
      partition: data.part.accountId,
      type: 'multipart',
      data: {
        upload_file: data.primary.file,
        use_defaults: 'true',
        folder_name: 'Saved Submissions',
        da_minor_version: '20230710',
        csrf_token: await this.getCSRF(data.part.accountId),
      },
    });

    if (fileUpload.body.status !== 'success') {
      return Promise.reject(
        this.createPostResponse({
          additionalInfo: fileUpload.body,
          message: 'Failed to upload file.',
        }),
      );
    }

    this.checkCancelled(cancellationToken);
    const mature =
      data.options.isMature ||
      data.options.rating === SubmissionRating.ADULT ||
      data.options.rating === SubmissionRating.MATURE ||
      data.options.rating === SubmissionRating.EXTREME;
    const description = await BrowserWindowUtil.runScriptOnPage<string>(
      data.part.accountId,
      this.BASE_URL,
      `
        var blocksFromHTML = Draft.convertFromHTML(\`${
          data.description.replace(/`/g, '&#96;') || '<div></div>'
        }\`);
        var x = Draft.ContentState.createFromBlockArray(
            blocksFromHTML.contentBlocks,
            blocksFromHTML.entityMap,
          )
        return JSON.stringify(Draft.convertToRaw(x))
      `,
    );

    const updateBody: any = {
      allow_comments: data.options.disableComments ? false : true,
      allow_free_download: data.options.freeDownload ? true : false,
      deviationid: fileUpload.body.deviationId,
      da_minor_version: 20230710,
      display_resolution: 0,
      editorRaw: description,
      editor_v3: '',
      galleryids: data.options.folders,
      is_ai_generated: data.options.isAIGenerated ?? false,
      is_scrap: data.options.scraps,
      license_options: {
        creative_commons: data.options.isCreativeCommons ?? false,
        commercial: data.options.isCommercialUse ?? false,
        modify: data.options.allowModifications || 'no',
      },
      location_tag: null,
      noai: data.options.noAI ?? true,
      subject_tag_types: '_empty',
      subject_tags: '_empty',
      tags: this.formatTags(data.tags),
      tierids: '_empty',
      title: this.truncateTitle(data.title).title,
      csrf_token: await this.getCSRF(data.part.accountId),
    };

    if (data.options.freeDownload) {
      updateBody.pcp_price_points = 0;
    }

    if (mature) {
      updateBody.is_mature = true;
    }

    if (data.options.folders.length === 0) {
      const folders = this.getAccountInfo(data.part.accountId, GenericAccountProp.FOLDERS) || [];
      const featured = folders.find(f => f.label === 'Featured');
      if (featured) {
        updateBody.galleryids = [`${featured.value}`];
      }
    }

    const update = await Http.post<{
      status: string;
      url: string;
      deviationId: number;
    }>(`${this.BASE_URL}/_napi/shared_api/deviation/update`, data.part.accountId, {
      type: 'json',
      data: updateBody,
      requestOptions: { json: true },
    });

    this.checkCancelled(cancellationToken);
    if (update.body.status !== 'success') {
      return Promise.reject(
        this.createPostResponse({
          additionalInfo: update.body,
          message: 'Failed to update file post.',
        }),
      );
    }

    const publish = await HttpExperimental.post<{
      status: string;
      url: string;
      deviationId: number;
    }>(`${this.BASE_URL}/_puppy/dashared/deviation/publish`, {
      partition: data.part.accountId,
      type: 'json',
      data: {
        stashid: fileUpload.body.deviationId,
        da_minor_version: 20230710,
        csrf_token: await this.getCSRF(data.part.accountId),
      },
    });

    if (publish.body.status !== 'success') {
      return Promise.reject(
        this.createPostResponse({
          additionalInfo: publish.body,
          message: 'Failed to publish post.',
        }),
      );
    }
    return this.createPostResponse({ source: publish.body.url });
  }

  async postNotificationSubmission(
    cancellationToken: CancellationToken,
    data: PostData<Submission, DefaultOptions>,
    accountData: DeviantArtAccountData,
  ): Promise<PostResponse> {
    this.checkCancelled(cancellationToken);
    const description = await BrowserWindowUtil.runScriptOnPage<string>(
      data.part.accountId,
      this.BASE_URL,
      `
        var blocksFromHTML = Draft.convertFromHTML(\`${
          data.description.replace(/`/g, '&#96;') || '<div></div>'
        }\`);
        var x = Draft.ContentState.createFromBlockArray(
            blocksFromHTML.contentBlocks,
            blocksFromHTML.entityMap,
          )
        return JSON.stringify(Draft.convertToRaw(x))
      `,
    );
    const form: any = {
      csrf_token: await this.getCSRF(data.part.accountId),
      da_minor_version: 20230710,
      editorRaw: description,
      title: data.title,
    };

    const create = await HttpExperimental.post<{
      deviation: {
        deviationId: number;
        url: string;
      };
    }>(`${this.BASE_URL}/_napi/shared_api/journal/create`, {
      partition: data.part.accountId,
      type: 'json',
      data: form,
    });

    if (!create.body.deviation?.deviationId) {
      return Promise.reject(
        this.createPostResponse({
          additionalInfo: create.body,
          message: 'Failed to create post.',
        }),
      );
    }

    const publish = await HttpExperimental.post<{
      deviation: {
        deviationId: number;
        url: string;
      };
    }>(`${this.BASE_URL}/_puppy/dashared/journal/publish`, {
      partition: data.part.accountId,
      type: 'json',
      data: {
        deviationid: create.body.deviation.deviationId,
        da_minor_version: 20230710,
        csrf_token: await this.getCSRF(data.part.accountId),
        featured: true,
      },
    });

    if (!publish.body.deviation?.deviationId) {
      return Promise.reject(
        this.createPostResponse({
          additionalInfo: publish.body,
          message: 'Failed to publish post.',
        }),
      );
    }

    return this.createPostResponse({ source: publish.body.deviation.url });
  }

  private titleLimit = 50;
  private truncateTitle(title: string) {
    const newTitle = title.substring(0, this.titleLimit);
    return { title: newTitle, exceedsLimit: newTitle !== title };
  }

  validateFileSubmission(
    submission: FileSubmission,
    submissionPart: SubmissionPart<DeviantArtFileOptions>,
    defaultPart: SubmissionPart<DefaultOptions>,
  ): ValidationParts {
    const problems: string[] = [];
    const warnings: string[] = [];
    const isAutoscaling: boolean = submissionPart.data.autoScale;

    const { title, exceedsLimit } = this.truncateTitle(
      submissionPart.data.title || defaultPart.data.title || submission.title,
    );
    if (exceedsLimit) {
      warnings.push(`Title will be truncated to ${this.titleLimit} characters: ${title}`);
    }

    if (submissionPart.data.folders && submissionPart.data.folders.length) {
      const folders: Folder[] = _.get(
        this.accountInformation.get(submissionPart.accountId),
        GenericAccountProp.FOLDERS,
        [],
      );
      submissionPart.data.folders.forEach(f => {
        if (!WebsiteValidator.folderIdExists(f, folders)) {
          warnings.push(`Folder (${f}) not found.`);
        }
      });
    }

    if (
      FormContent.getTags(defaultPart.data.tags, submissionPart.data.tags).length > this.MAX_TAGS
    ) {
      problems.push(`Tags will be limited to ${this.MAX_TAGS}.`);
    }

    const rating = submissionPart.data.rating || defaultPart.data.rating;
    if ((rating && rating === SubmissionRating.EXTREME) || rating === SubmissionRating.ADULT) {
      problems.push(`${rating} rating may violate website guidelines.`);
    }

    if (!WebsiteValidator.supportsFileType(submission.primary, this.acceptsFiles)) {
      problems.push(`Currently supported file formats: ${this.acceptsFiles.join(', ')}`);
    }

    const { type, size, name } = submission.primary;
    let maxMB: number = 30;
    if (type === FileSubmissionType.VIDEO) {
      maxMB = 200;
    }
    if (FileSize.MBtoBytes(maxMB) < size) {
      if (
        isAutoscaling &&
        type === FileSubmissionType.IMAGE &&
        ImageManipulator.isMimeType(submission.primary.mimetype)
      ) {
        warnings.push(`${name} will be scaled down to ${maxMB}MB`);
      } else {
        problems.push(`Deviant Art limits ${submission.primary.mimetype} to ${maxMB}MB`);
      }
    }

    return { problems, warnings };
  }
}
