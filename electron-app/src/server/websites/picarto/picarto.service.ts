import { Injectable } from '@nestjs/common';
import {
  DefaultOptions,
  FileRecord,
  FileSubmission,
  FileSubmissionType,
  Folder,
  PicartoFileOptions,
  PostResponse,
  SubmissionPart,
} from 'postybirb-commons';
import userAccountEntity from 'src/server/account/models/user-account.entity';
import { PlaintextParser } from 'src/server/description-parsing/plaintext/plaintext.parser';
import ImageManipulator from 'src/server/file-manipulation/manipulators/image.manipulator';
import Http from 'src/server/http/http.util';
import { CancellationToken } from 'src/server/submission/post/cancellation/cancellation-token';
import { FilePostData } from 'src/server/submission/post/interfaces/file-post-data.interface';
import { ValidationParts } from 'src/server/submission/validator/interfaces/validation-parts.interface';
import BrowserWindowUtil from 'src/server/utils/browser-window.util';
import FileSize from 'src/server/utils/filesize.util';
import WebsiteValidator from 'src/server/utils/website-validator.util';
import { GenericAccountProp } from '../generic/generic-account-props.enum';
import { LoginResponse } from '../interfaces/login-response.interface';
import { ScalingOptions } from '../interfaces/scaling-options.interface';
import { Website } from '../website.base';

@Injectable()
export class Picarto extends Website {
  BASE_URL: string = 'https://picarto.tv';
  acceptsFiles: string[] = ['jpeg', 'jpg', 'png', 'gif'];
  acceptsAdditionalFiles: boolean = false;
  readonly defaultDescriptionParser = PlaintextParser.parse;
  readonly usernameShortcuts = [
    {
      key: 'ptv',
      url: 'https://picarto.tv/$1',
    },
  ];

  async checkLoginStatus(data: userAccountEntity): Promise<LoginResponse> {
    const status: LoginResponse = { loggedIn: false, username: null };
    const ls: { auth: string } = await BrowserWindowUtil.getLocalStorage(data._id, this.BASE_URL);

    if (!ls.auth) {
      return status;
    }

    const auth: { access_token: string; user: { username: string } } = JSON.parse(ls.auth);

    this.storeAccountInformation(data._id, 'auth_token', auth.access_token);
    status.loggedIn = true;
    status.username = auth.user.username;

    await this.getAlbums(data._id, auth.access_token);

    return status;
  }

  private async getAlbums(id: string, accessToken: string) {
    const res = await Http.post<{
      data: {
        albums: {
          id: string | null;
          title: string;
        }[];
      };
    }>('https://ptvintern.picarto.tv/ptvapi', id, {
      type: 'json',
      data: {
        query:
          '{\n  albums {\n    id\n    title\n    cover\n    artworks {\n      id\n      thumbnail_image {\n        name\n        __typename\n      }\n      __typename\n    }\n    default\n    pieces\n    __typename\n  }\n  listContest {\n    id\n    name: event_name\n    cover\n    __typename\n  }\n}\n',
        variables: {},
      },
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      requestOptions: {
        json: true,
      },
    });

    const { data } = res.body;
    const { albums } = data;

    const folders: Folder[] = albums.map((album) => ({ value: album.id, label: album.title }));

    this.storeAccountInformation(id, GenericAccountProp.FOLDERS, folders);
  }

  getScalingOptions(file: FileRecord): ScalingOptions {
    return { maxSize: FileSize.MBtoBytes(15) };
  }

  async postFileSubmission(
    cancellationToken: CancellationToken,
    data: FilePostData<PicartoFileOptions>,
    accountData: any,
  ): Promise<PostResponse> {
    const authToken = this.getAccountInfo(data.part.accountId, 'auth_token');
    const channelId: string = 'TODO';

    this.checkCancelled(cancellationToken);

    const uploadRes = await Http.post<string>(
      `${this.BASE_URL}/images/_upload`,
      data.part.accountId,
      {
        type: 'multipart',
        data: {
          file_name: data.primary.file,
          channel_id: channelId,
        },
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      },
    );

    this.verifyResponse(uploadRes, 'File upload');

    return null;
  }

  formatTags(tags: string[]) {
    return super
      .formatTags(tags, { spaceReplacer: '_', maxLength: 30, minLength: 1 })
      .filter((tag) => tag.length >= 1)
      .slice(0, 30);
  }

  validateFileSubmission(
    submission: FileSubmission,
    submissionPart: SubmissionPart<PicartoFileOptions>,
    defaultPart: SubmissionPart<DefaultOptions>,
  ): ValidationParts {
    const problems: string[] = [];
    const warnings: string[] = [];
    const isAutoscaling: boolean = submissionPart.data.autoScale;

    if (!WebsiteValidator.supportsFileType(submission.primary, this.acceptsFiles)) {
      problems.push(`Currently supported file formats: ${this.acceptsFiles.join(', ')}`);
    }

    const { type, size, name } = submission.primary;
    if (FileSize.MBtoBytes(15) < size) {
      if (
        isAutoscaling &&
        type === FileSubmissionType.IMAGE &&
        ImageManipulator.isMimeType(submission.primary.mimetype)
      ) {
        warnings.push(`${name} will be scaled down to ${15}MB`);
      } else {
        problems.push(`Picarto limits ${submission.primary.mimetype} to ${15}MB`);
      }
    }

    return { problems, warnings };
  }
}
