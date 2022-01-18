import { Injectable } from '@nestjs/common';
import {
  DefaultFileOptions,
  DefaultOptions,
  FileRecord,
  FileSubmission,
  FileSubmissionType,
  PostResponse,
  SubmissionPart,
} from 'postybirb-commons';
import UserAccountEntity from 'src/server/account/models/user-account.entity';
import { PlaintextParser } from 'src/server/description-parsing/plaintext/plaintext.parser';
import ImageManipulator from 'src/server/file-manipulation/manipulators/image.manipulator';
import Http from 'src/server/http/http.util';
import { CancellationToken } from 'src/server/submission/post/cancellation/cancellation-token';
import { FilePostData } from 'src/server/submission/post/interfaces/file-post-data.interface';
import { ValidationParts } from 'src/server/submission/validator/interfaces/validation-parts.interface';
import BrowserWindowUtil from 'src/server/utils/browser-window.util';
import FileSize from 'src/server/utils/filesize.util';
import FormContent from 'src/server/utils/form-content.util';
import WebsiteValidator from 'src/server/utils/website-validator.util';
import { LoginResponse } from '../interfaces/login-response.interface';
import { ScalingOptions } from '../interfaces/scaling-options.interface';
import { Website } from '../website.base';
import _ = require('lodash');
import { GenericAccountProp } from '../generic/generic-account-props.enum';

@Injectable()
export class Itaku extends Website {
  BASE_URL: string = 'https://itaku.ee';
  acceptsFiles: string[] = ['jpeg', 'jpg', 'png', 'gif', 'webp', 'mp4', 'mov'];
  acceptsAdditionalFiles: boolean = true;
  readonly defaultDescriptionParser = PlaintextParser.parse;
  readonly usernameShortcuts = [
    {
      key: 'it',
      url: 'https://itaku.ee/profile/$1',
    },
  ];

  async checkLoginStatus(data: UserAccountEntity): Promise<LoginResponse> {
    const status: LoginResponse = { loggedIn: false, username: null };
    const ls = await BrowserWindowUtil.getLocalStorage(data._id, this.BASE_URL);

    if (!ls.token) {
      return status;
    }

    this.storeAccountInformation(data._id, 'token', ls.token);

    const res = await Http.get<any>(`${this.BASE_URL}/api/auth/user/`, data._id, {
      requestOptions: { json: true },
      headers: {
        Authorization: `Token ${this.getAccountInfo(data._id, 'token')}`,
      },
    });
    const login: string = _.get(res.body, 'profile.displayname');
    if (login) {
      status.loggedIn = true;
      status.username = login;
      await this.retrieveFolders(data._id, status.username);
    }

    return status;
  }

  getScalingOptions(file: FileRecord): ScalingOptions {
    return { maxSize: FileSize.MBtoBytes(100) };
  }

  async retrieveFolders(id: string, loginName: string): Promise<void> {
    const res = await Http.get<string[]>(`${this.BASE_URL}/api/post_folders/get_my_folders`, id, {
      requestOptions: { json: true },
      headers: {
        Authorization: `Token ${this.getAccountInfo(id, 'token')}`,
      },
    });

    const folders = res.body || [];
    this.storeAccountInformation(id, GenericAccountProp.FOLDERS, folders);
  }

  postFileSubmission(
    cancellationToken: CancellationToken,
    data: FilePostData<DefaultFileOptions>,
    accountData: any,
  ): Promise<PostResponse> {
    throw new Error('Method not implemented.');
  }

  validateFileSubmission(
    submission: FileSubmission,
    submissionPart: SubmissionPart<any>,
    defaultPart: SubmissionPart<DefaultOptions>,
  ): ValidationParts {
    const problems: string[] = [];
    const warnings: string[] = [];
    const isAutoscaling: boolean = submissionPart.data.autoScale;

    if (FormContent.getTags(defaultPart.data.tags, submissionPart.data.tags).length < 2) {
      problems.push('Requires at least 2 tags.');
    }

    const { type, size, name, mimetype } = submission.primary;

    if (!WebsiteValidator.supportsFileType(submission.primary, this.acceptsFiles)) {
      problems.push(`Currently supported file formats: ${this.acceptsFiles.join(', ')}`);
    }

    const maxMB = 100;
    if (FileSize.MBtoBytes(maxMB) < size) {
      if (
        isAutoscaling &&
        type === FileSubmissionType.IMAGE &&
        ImageManipulator.isMimeType(submission.primary.mimetype)
      ) {
        warnings.push(`${name} will be scaled down to ${maxMB}MB`);
      } else {
        problems.push(`Itaku limits ${submission.primary.mimetype} to ${maxMB}MB`);
      }
    }

    return { problems, warnings };
  }
}
