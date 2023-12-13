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
import { UsernameParser } from 'src/server/description-parsing/miscellaneous/username.parser';
import ImageManipulator from 'src/server/file-manipulation/manipulators/image.manipulator';
import Http from 'src/server/http/http.util';
import { CancellationToken } from 'src/server/submission/post/cancellation/cancellation-token';
import { FilePostData } from 'src/server/submission/post/interfaces/file-post-data.interface';
import { PostData } from 'src/server/submission/post/interfaces/post-data.interface';
import { ValidationParts } from 'src/server/submission/validator/interfaces/validation-parts.interface';
import FileSize from 'src/server/utils/filesize.util';
import FormContent from 'src/server/utils/form-content.util';
import { ApiResponse, OAuthUtil } from 'src/server/utils/oauth.util';
import WebsiteValidator from 'src/server/utils/website-validator.util';
import { GenericAccountProp } from '../generic/generic-account-props.enum';
import { LoginResponse } from '../interfaces/login-response.interface';
import { ScalingOptions } from '../interfaces/scaling-options.interface';
import { Website } from '../website.base';

interface DeviantArtFolder {
  description: string;
  folderid: string;
  has_subfolders: boolean;
  name: string;
  parent?: string;
  subfolders: DeviantArtFolder[];
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
  readonly refreshInterval = 10 * 60000;
  readonly usernameShortcuts = [
    {
      key: 'da',
      url: 'https://deviantart.com/$1',
    },
  ];
  private readonly MAX_TAGS = 30;

  async checkLoginStatus(data: UserAccountEntity): Promise<LoginResponse> {
    const status: LoginResponse = { loggedIn: false, username: null };
    const accountData: DeviantArtAccountData = data.data;
    if (accountData && accountData.username) {
      const renewData = await this.refreshToken(accountData);
      if (renewData && renewData.username) {
        status.loggedIn = true;
        status.username = accountData.username;
        status.data = renewData;

        await this.getFolders(data._id, renewData.access_token);
      }
    }
    return status;
  }

  private async refreshToken(data: DeviantArtAccountData) {
    const expireTime = data.created + (data.expires_in - 300) * 1000; // expires at 55+ minutes
    if (expireTime > Date.now()) {
      const placebo = await Http.get<{ status: string }>(
        `https://www.deviantart.com/api/v1/oauth2/placebo?access_token=${data.access_token}`,
        undefined,
        {
          requestOptions: { json: true },
        },
      );

      if (placebo.body.status === 'success') {
        return data;
      }
    }

    const renew = await Http.post<ApiResponse<DeviantArtAccountData>>(
      OAuthUtil.getURL('deviant-art/v2/refresh'),
      undefined,
      {
        type: 'json',
        data: { token: data.refresh_token },
      },
    );

    if (!renew.body.success) {
      return null;
    }

    const renewed = renew.body.data;
    renewed.created = Date.now();
    return renewed;
  }

  private flattenFolders(folder: DeviantArtFolder): DeviantArtFolder[] {
    const folders = [folder];

    if (!folder) {
      return [];
    }

    if (!folder.has_subfolders) {
      return folders;
    }

    folder.subfolders.forEach(sf => folders.push(...this.flattenFolders(sf)));
    return folders;
  }

  private async getFolders(profileId: string, token: string) {
    const res = await Http.get<{
      results: Array<DeviantArtFolder>;
    }>(
      `${this.BASE_URL}/api/v1/oauth2/gallery/folders?calculate_size=false&limit=50&access_token=${token}`,
      undefined,
      { requestOptions: { json: true } },
    );

    const folders: Folder[] = [];
    const results = res.body.results || [];
    const flattenedFolders: DeviantArtFolder[] = [];
    results.forEach((r: DeviantArtFolder) => flattenedFolders.push(...this.flattenFolders(r)));

    flattenedFolders.forEach(folder => {
      const parent = folder.parent
        ? flattenedFolders.find(f => f.folderid === folder.parent && f.name !== 'Featured')
        : undefined;
      folders.push({
        value: folder.folderid,
        label: parent ? `${parent.name} / ${folder.name}` : folder.name,
      });
    });

    this.storeAccountInformation(profileId, GenericAccountProp.FOLDERS, folders);
  }

  getScalingOptions(file: FileRecord): ScalingOptions {
    return { maxSize: FileSize.MBtoBytes(30) };
  }

  preparseDescription(text: string) {
    return UsernameParser.replaceText(text, 'da', ':icon$1::dev$1:');
  }

  parseDescription(text: string) {
    text = text
      .replace(/style="text-align:center;"/g, 'align="center"')
      .replace(/style="text-align:right;"/g, 'align="right"');

    text = UsernameParser.replaceText(text, 'da', ':icon$1::dev$1:');
    return text.replace(/<p/gm, '<div').replace(/<\/p>/gm, '</div>').replace(/\n/g, '<br>');
  }

  formatTags(tags: string[]): string[] {
    tags = super.parseTags(tags);
    if (tags.length > this.MAX_TAGS) {
      return tags.slice(0, this.MAX_TAGS - 1);
    } else return tags;
  }

  async postFileSubmission(
    cancellationToken: CancellationToken,
    data: FilePostData<DeviantArtFileOptions>,
    accountData: DeviantArtAccountData,
  ): Promise<PostResponse> {
    const uploadForm: any = {
      title: data.title.substring(0, 50),
      access_token: accountData.access_token,
      file: data.primary.file,
      artist_comments: data.description,
    };

    this.formatTags(data.tags)
      .map(t => t.replace(/\//g, '_'))
      .forEach((t, i) => {
        uploadForm[`tags[${i}]`] = t;
      });

    this.checkCancelled(cancellationToken);
    const upload = await Http.post<{ itemid: string; error_description: string }>(
      `${this.BASE_URL}/api/v1/oauth2/stash/submit`,
      undefined,
      {
        type: 'multipart',
        data: uploadForm,
        requestOptions: { json: true },
      },
    );

    if (!upload.body.itemid) {
      return Promise.reject(
        this.createPostResponse({
          additionalInfo: upload.body,
          message: upload.body.error_description,
        }),
      );
    }

    const { options } = data;
    const form: any = {
      access_token: accountData.access_token,
      itemid: upload.body.itemid,
      agree_tos: '1',
      agree_submission: '1',
      is_mature: data.rating !== SubmissionRating.GENERAL ? 'true' : 'false',
      display_resolution: options.displayResolution || '0',
    };

    if (data.rating !== SubmissionRating.GENERAL) {
      form.mature_level = 'moderate';
    }

    options.matureClassification.forEach((classification, i) => {
      form[`mature_classification[${i}]`] = classification;
    });

    if (options.matureLevel || options.matureClassification.length) {
      form.mature_level = options.matureLevel || 'moderate';
      form.is_mature = 'true';
    }
    if (options.disableComments) {
      form.allow_comments = 'no';
    }
    if (options.critique) {
      form.request_critique = 'yes';
    }
    form.allow_free_download = options.freeDownload ? 'yes' : 'no';
    form.feature = options.feature ? 'yes' : 'no';
    if (options.displayResolution) {
      form.display_resolution = options.displayResolution;
    }
    if (options.scraps) {
      form.catpath = 'scraps';
    }

    // Do not send to folders when scraps is true
    if (!options.scraps) {
      options.folders.forEach((folder, i) => {
        form[`galleryids[${i}]`] = folder;
      });
    }

    this.checkCancelled(cancellationToken);
    const post = await Http.post<any>(`${this.BASE_URL}/api/v1/oauth2/stash/publish`, undefined, {
      type: 'multipart',
      data: form,
      requestOptions: { json: true },
    });

    this.verifyResponse(post, 'Verify post');
    if (post.body.error_description || post.body.status !== 'success') {
      return Promise.reject(
        this.createPostResponse({
          additionalInfo: post.body,
          message: post.body.error_description,
        }),
      );
    }

    const deviationId = post.body?.deviationid;
    if (deviationId && options.folders.length) {
      // Used to move posts to selected folders due to the api not doing this correctly anymore
      const folders: Folder[] = _.get(
        this.accountInformation.get(data.part.accountId),
        GenericAccountProp.FOLDERS,
        [],
      );

      // Find the featured folder id and remove it from the selected lis to determine actions to take
      const featuredId = folders.find(f => f.label === 'Featured').value;
      let removeFromFeatured = !options.folders.some(f => f === featuredId);
      if (options.feature) {
        removeFromFeatured = false;
      }
      const featureFilteredFolders = options.folders.filter(fid => fid !== featuredId);
      // Copy to other folders when other folders are provided
      if (featureFilteredFolders.length) {
        for (const folderId of featureFilteredFolders) {
          await Http.post<any>(
            `${this.BASE_URL}/api/v1/oauth2/gallery/folders/copy_deviations`,
            undefined,
            {
              type: 'multipart',
              data: {
                access_token: accountData.access_token,
                target_folderid: folderId,
                'deviationids[0]': deviationId,
              },
              requestOptions: { json: true },
            },
          );
        }

        if (removeFromFeatured) {
          await Http.post<any>(
            `${this.BASE_URL}/api/v1/oauth2/gallery/folders/remove_deviations`,
            undefined,
            {
              type: 'multipart',
              data: {
                access_token: accountData.access_token,
                folderid: featuredId,
                'deviationids[0]': deviationId,
              },
              requestOptions: { json: true },
            },
          );
        }
      }
    }

    return this.createPostResponse({ source: post.body.url });
  }

  async postNotificationSubmission(
    cancellationToken: CancellationToken,
    data: PostData<Submission, DefaultOptions>,
    accountData: DeviantArtAccountData,
  ): Promise<PostResponse> {
    this.checkCancelled(cancellationToken);
    const post = await Http.post<any>(
      `${this.BASE_URL}/api/v1/oauth2/user/statuses/post`,
      undefined,
      {
        requestOptions: { json: true },
        type: 'multipart',
        data: {
          body: data.description,
          access_token: accountData.access_token,
        },
      },
    );

    this.verifyResponse(post, 'Verify Post');
    if (post.body.error_description) {
      return Promise.reject(
        this.createPostResponse({
          additionalInfo: post.body,
          message: post.body.error_description,
        }),
      );
    }

    return this.createPostResponse({});
  }

  validateFileSubmission(
    submission: FileSubmission,
    submissionPart: SubmissionPart<DeviantArtFileOptions>,
    defaultPart: SubmissionPart<DefaultOptions>,
  ): ValidationParts {
    const problems: string[] = [];
    const warnings: string[] = [];
    const isAutoscaling: boolean = submissionPart.data.autoScale;

    const title = submissionPart.data.title || defaultPart.data.title || submission.title;
    if (title.length > 50) {
      warnings.push(`Title will be truncated to 50 characters: ${title.substring(0, 50)}`);
    }

    if (submissionPart.data.folders && submissionPart.data.folders.length) {
      const folders: Folder[] = _.get(
        this.accountInformation.get(submissionPart.accountId),
        GenericAccountProp.FOLDERS,
        [],
      );
      submissionPart.data.folders.forEach(f => {
        if (!WebsiteValidator.folderIdExists(f, folders)) {
          problems.push(`Folder (${f}) not found.`);
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
