import { Injectable } from '@nestjs/common';
import * as _ from 'lodash';
import UserAccountEntity from 'src/account/models/user-account.entity';
import { UsernameParser } from 'src/description-parsing/miscellaneous/username.parser';
import ImageManipulator from 'src/file-manipulation/manipulators/image.manipulator';
import Http from 'src/http/http.util';
import { SubmissionRating } from 'src/submission/enums/submission-rating.enum';
import { FileSubmissionType } from 'src/submission/file-submission/enums/file-submission-type.enum';
import { FileRecord } from 'src/submission/file-submission/interfaces/file-record.interface';
import { FileSubmission } from 'src/submission/file-submission/interfaces/file-submission.interface';
import { Submission } from 'src/submission/interfaces/submission.interface';
import { CancellationToken } from 'src/submission/post/cancellation/cancellation-token';
import { FilePostData } from 'src/submission/post/interfaces/file-post-data.interface';
import { PostData } from 'src/submission/post/interfaces/post-data.interface';
import { PostResponse } from 'src/submission/post/interfaces/post-response.interface';
import { DefaultOptions } from 'src/submission/submission-part/interfaces/default-options.interface';
import { SubmissionPart } from 'src/submission/submission-part/interfaces/submission-part.interface';
import { ValidationParts } from 'src/submission/validator/interfaces/validation-parts.interface';
import FileSize from 'src/utils/filesize.util';
import { ApiResponse, OAuthUtil } from 'src/utils/oauth.util';
import WebsiteValidator from 'src/utils/website-validator.util';
import { GenericAccountProp } from '../generic/generic-account-props.enum';
import { GenericDefaultNotificationOptions } from '../generic/generic.defaults';
import { Folder } from '../interfaces/folder.interface';
import { LoginResponse } from '../interfaces/login-response.interface';
import { ScalingOptions } from '../interfaces/scaling-options.interface';
import { Website } from '../website.base';
import { DeviantArtAccountData } from './deviant-art-account.interface';
import { DeviantArtDefaultFileOptions } from './deviant-art.defaults';
import { DeviantArtFileOptions } from './deviant-art.interface';

@Injectable()
export class DeviantArt extends Website {
  readonly BASE_URL = 'https://www.deviantart.com';
  readonly fileSubmissionOptions = DeviantArtDefaultFileOptions;
  readonly notificationSubmissionOptions = GenericDefaultNotificationOptions;
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
  ];
  readonly refreshInterval = 5 * 60000;
  readonly usernameShortcuts = [
    {
      key: 'da',
      url: 'https://deviantart.com/$1',
    },
  ];

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
      OAuthUtil.getURL('deviant-art/v1/refresh'),
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

  private async getFolders(profileId: string, token: string) {
    const res = await Http.get<{ results: { folderid: string; name: string; parent: string }[] }>(
      `${this.BASE_URL}/api/v1/oauth2/gallery/folders?calculate_size=false&limit=50&access_token=${token}`,
      undefined,
      { requestOptions: { json: true } },
    );

    const folders: Folder[] = [];
    const results = res.body.results || [];
    results.forEach(folder => {
      const parent = folder.parent
        ? results.find(f => f.folderid === folder.parent && f.name !== 'Featured')
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
    return text
      .replace(/<p/gm, '<div')
      .replace(/<\/p>/gm, '</div>')
      .replace(/\n/g, '');
  }

  private getDefaultCategoryType(type: FileSubmissionType): string {
    switch (type) {
      case FileSubmissionType.VIDEO:
        return 'flash/animations';
      case FileSubmissionType.TEXT:
        return 'literature/prose/fiction/general/shortstory';
      case FileSubmissionType.IMAGE:
      default:
        return 'digitalart/paintings/other';
    }
  }

  async postFileSubmission(
    cancellationToken: CancellationToken,
    data: FilePostData<DeviantArtFileOptions>,
    accountData: DeviantArtAccountData,
  ): Promise<PostResponse> {
    const uploadForm: any = {
      title: data.title,
      access_token: accountData.access_token,
      file: data.primary.file,
      artist_comments: data.description,
    };

    this.parseTags(data.tags).forEach((t, i) => {
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
      catpath: this.getDefaultCategoryType(data.primary.type),
      display_resolution: options.displayResolution || '0',
    };

    if (data.rating !== SubmissionRating.GENERAL) {
      form.mature_level = 'moderate';
    }

    options.matureClassification.forEach((classification, i) => {
      form[`mature_classification[${i}]`] = classification;
    });

    if (options.matureLevel) form.mature_level = options.matureLevel;
    if (options.disableComments) form.allow_comments = 'no';
    if (options.critique) form.request_critique = 'yes';
    if (options.freeDownload) form.allow_free_download = 'no';
    if (options.feature) form.feature = 'yes';
    if (options.displayResolution) form.display_resolution = options.displayResolution;

    options.folders.forEach((folder, i) => {
      form[`galleryids[${i}]`] = folder;
    });

    this.checkCancelled(cancellationToken);
    const post = await Http.post<any>(`${this.BASE_URL}/api/v1/oauth2/stash/publish`, undefined, {
      type: 'multipart',
      data: form,
      requestOptions: { json: true },
    });

    console.log(post.body);
    this.verifyResponse(post, 'Verify post');
    if (post.body.error_description || post.body.status !== 'success') {
      return Promise.reject(
        this.createPostResponse({
          additionalInfo: post.body,
          message: post.body.error_description,
        }),
      );
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

    if (submissionPart.data.folders && submissionPart.data.folders.length) {
      const folders: Folder[] = _.get(
        this.accountInformation.get(submissionPart.accountId),
        GenericAccountProp.FOLDERS,
        [],
      );
      submissionPart.data.folders.forEach(f => {
        if (!WebsiteValidator.folderIdExists(f, folders)) {
          problems.push(`Folder not found: ${f}`);
        }
      });
    }

    const rating = submissionPart.data.rating || defaultPart.data.rating;
    if ((rating && rating === SubmissionRating.EXTREME) || rating === SubmissionRating.ADULT) {
      problems.push(`Does not support rating: ${rating}`);
    }

    if (!WebsiteValidator.supportsFileType(submission.primary, this.acceptsFiles)) {
      problems.push(
        `Does not support file format: (${submission.primary.name}) ${submission.primary.mimetype}.`,
      );
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
