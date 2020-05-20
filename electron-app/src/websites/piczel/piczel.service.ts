import { Injectable } from '@nestjs/common';
import * as _ from 'lodash';
import UserAccountEntity from 'src/account/models/user-account.entity';
import ImageManipulator from 'src/file-manipulation/manipulators/image.manipulator';
import Http from 'src/http/http.util';
import { SubmissionRating } from 'src/submission/enums/submission-rating.enum';
import { FileSubmissionType } from 'src/submission/file-submission/enums/file-submission-type.enum';
import { FileRecord } from 'src/submission/file-submission/interfaces/file-record.interface';
import { FileSubmission } from 'src/submission/file-submission/interfaces/file-submission.interface';
import { CancellationToken } from 'src/submission/post/cancellation/cancellation-token';
import { FilePostData } from 'src/submission/post/interfaces/file-post-data.interface';
import { PostResponse } from 'src/submission/post/interfaces/post-response.interface';
import { DefaultOptions } from 'src/submission/submission-part/interfaces/default-options.interface';
import { SubmissionPart } from 'src/submission/submission-part/interfaces/submission-part.interface';
import { ValidationParts } from 'src/submission/validator/interfaces/validation-parts.interface';
import FileSize from 'src/utils/filesize.util';
import { Folder } from 'src/websites/interfaces/folder.interface';
import { LoginResponse } from 'src/websites/interfaces/login-response.interface';
import { Website } from 'src/websites/website.base';
import { ScalingOptions } from '../interfaces/scaling-options.interface';
import { PiczelDefaultFileOptions } from './piczel.defaults';
import { PiczelFileOptions } from './piczel.interface';
import WebsiteValidator from 'src/utils/website-validator.util';
import { GenericAccountProp } from '../generic/generic-account-props.enum';

@Injectable()
export class Piczel extends Website {
  readonly BASE_URL: string = 'https://piczel.tv';
  readonly acceptsFiles: string[] = ['png', 'jpeg', 'jpg', 'gif'];
  readonly acceptsAdditionalFiles: boolean = true;

  readonly fileSubmissionOptions: PiczelFileOptions = PiczelDefaultFileOptions;

  readonly usernameShortcuts = [
    {
      key: 'pz',
      url: 'https://piczel.tv/gallery/$1',
    },
  ];

  async checkLoginStatus(data: UserAccountEntity): Promise<LoginResponse> {
    const status: LoginResponse = { loggedIn: false, username: null };
    const res = await Http.get<string>(`${this.BASE_URL}/gallery/upload`, data._id);
    if (!res.body.includes('/signup')) {
      status.loggedIn = true;
      const preloadedData = JSON.parse(
        res.body.match(
          /<script type="text\/javascript">window\.__PRELOADED_STATE__ = (.*?)<\/script>/ms,
        )[1],
      );
      status.username = preloadedData.currentUser.data.username;
      this.storeAccountInformation(data._id, 'data', preloadedData);
      this.getFolders(data._id, status.username);
    }
    return status;
  }

  private async getFolders(profileId: string, username: string) {
    const res = await Http.get<{ id: number; name: string }[]>(
      `${this.BASE_URL}/api/users/${username}/gallery/folders`,
      profileId,
      {
        requestOptions: { json: true },
      },
    );

    const folders: Folder[] = [{ value: undefined, label: 'None' }];

    folders.push(
      ...res.body.map(f => ({
        value: f.id.toString(),
        label: f.name,
      })),
    );

    this.storeAccountInformation(profileId, GenericAccountProp.FOLDERS, folders);
  }

  getScalingOptions(file: FileRecord): ScalingOptions {
    return { maxSize: FileSize.MBtoBytes(30) };
  }

  parseDescription(text: string): string {
    return text;
  }

  async postFileSubmission(
    cancellationToken: CancellationToken,
    data: FilePostData<PiczelFileOptions>,
  ): Promise<PostResponse> {
    const form: any = {
      nsfw: data.rating !== SubmissionRating.GENERAL,
      description: data.description,
      title: data.title || 'New Submission',
      tags: this.formatTags(data.tags),
      files: [data.primary, ...data.additional]
        .filter(f => f)
        .map(f => ({
          name: f.file.options.filename,
          size: f.file.value.length,
          type: f.file.options.contentType,
          data: `data:${f.file.options.contentType};base64,${f.file.value.toString('base64')}`,
        })),
      uploadMode: 'PUBLISH',
      queue: false,
      publish_at: '',
      thumbnail_id: '0',
    };

    if (data.options.folder) {
      form.folder_id = data.options.folder;
    }

    const userData = this.getAccountInfo(data.part.accountId, 'data');
    const headers: any = {
      Accent: '*/*',
      client: userData.auth.client,
      expiry: userData.auth.expiry,
      'token-type': userData.auth['token-type'],
      uid: userData.auth.uid,
      Authorization: `${userData.auth['token-type']} ${userData.auth['access-token']}`,
      'access-token': userData.auth['access-token'],
    };

    this.checkCancelled(cancellationToken);
    const postResponse = await Http.post<any>(`${this.BASE_URL}/api/gallery`, data.part.accountId, {
      type: 'json',
      data: form,
      headers,
      requestOptions: { json: true },
    });

    this.verifyResponse(postResponse, 'Post');

    if (postResponse.body.id) {
      return this.createPostResponse({
        source: `${this.BASE_URL}/gallery/image/${postResponse.body.id}`,
      });
    }

    return Promise.reject(this.createPostResponse({ additionalInfo: postResponse.body }));
  }

  validateFileSubmission(
    submission: FileSubmission,
    submissionPart: SubmissionPart<PiczelFileOptions>,
    defaultPart: SubmissionPart<DefaultOptions>,
  ): ValidationParts {
    const problems: string[] = [];
    const warnings: string[] = [];
    const isAutoscaling: boolean = submissionPart.data.autoScale;

    if (submissionPart.data.folder) {
      const folders: Folder[] = _.get(
        this.accountInformation.get(submissionPart.accountId),
        GenericAccountProp.FOLDERS,
        [],
      );
      if (!folders.find(f => f.value === submissionPart.data.folder)) {
        warnings.push(`Folder (${submissionPart.data.folder}) not found.`);
      }
    }

    const files = [
      submission.primary,
      ...(submission.additional || []).filter(
        f => !f.ignoredAccounts!.includes(submissionPart.accountId),
      ),
    ];

    const maxMB: number = 30;
    files.forEach(file => {
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
          problems.push(`Piczel limits ${mimetype} to ${maxMB}MB`);
        }
      }
    });

    return { problems, warnings };
  }
}
