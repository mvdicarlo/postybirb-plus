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
  SubmissionRating,
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
  readonly MAX_CHARS: number = undefined; // No Limit
  acceptsAdditionalFiles: boolean = true;
  refreshBeforePost: boolean = true;
  readonly defaultDescriptionParser = PlaintextParser.parse;
  readonly usernameShortcuts = [
    {
      key: 'ptv',
      url: 'https://picarto.tv/$1',
    },
  ];

  async checkLoginStatus(data: userAccountEntity): Promise<LoginResponse> {
    const status: LoginResponse = { loggedIn: false, username: null };
    const ls: { auth: string } = await BrowserWindowUtil.getLocalStorage(
      data._id,
      this.BASE_URL,
      3000,
    );

    if (!ls.auth) {
      return status;
    }

    const auth: {
      access_token: string;
      user: { username: string; id: number; channel: { id: string } };
    } = JSON.parse(ls.auth);

    this.storeAccountInformation(data._id, 'auth_token', auth.access_token);
    this.storeAccountInformation(data._id, 'channelId', auth.user.channel.id);
    this.storeAccountInformation(data._id, 'username', auth.user.username);
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

    const folders: Folder[] = albums.map(album => ({ value: album.id, label: album.title }));

    this.storeAccountInformation(id, GenericAccountProp.FOLDERS, folders);
  }

  getScalingOptions(file: FileRecord): ScalingOptions {
    return { maxSize: FileSize.MBtoBytes(15) };
  }

  private getRating(rating: SubmissionRating): string {
    switch (rating) {
      case SubmissionRating.GENERAL:
        return 'SFW';
      case SubmissionRating.MATURE:
        return 'ECCHI';
      case SubmissionRating.ADULT:
      case SubmissionRating.EXTREME:
        return 'NSFW';
    }
  }

  async postFileSubmission(
    cancellationToken: CancellationToken,
    data: FilePostData<PicartoFileOptions>,
    accountData: any,
  ): Promise<PostResponse> {
    const authToken = this.getAccountInfo(data.part.accountId, 'auth_token');
    const channelId: string = this.getAccountInfo(data.part.accountId, 'channelId');

    const authRes = await Http.post<{ data: { generateJwtToken: { key: string } } }>(
      'https://ptvintern.picarto.tv/ptvapi',
      undefined,
      {
        type: 'json',
        data: {
          operationName: 'generateToken',
          query:
            'query generateToken($channelId: Int, $channelName: String, $userId: Int) {\n  generateJwtToken(\n    channel_id: $channelId\n    channel_name: $channelName\n    user_id: $userId\n  ) {\n    key\n    __typename\n  }\n}',
          variables: {
            channelId: channelId,
          },
        },
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
        requestOptions: {
          json: true,
        },
      },
    );

    this.verifyResponse(authRes, 'Auth get');
    this.checkCancelled(cancellationToken);

    const uploadRes = await Http.post<{ message: string; error: string; data: { uid: string } }>(
      `https://picarto.tv/images/_upload`,
      undefined,
      {
        type: 'multipart',
        data: {
          file_name: data.primary.file,
          channel_id: channelId.toString(),
        },
        headers: {
          Authorization: `Bearer ${authRes.body.data.generateJwtToken.key}`,
        },
        requestOptions: {
          json: true,
        },
      },
    );

    this.verifyResponse(uploadRes, 'File upload');

    const variations = (
      await Promise.all(
        data.additional.slice(0, 4).map(({ file }) => {
          return Http.post<{ message: string; error: string; data: { uid: string } }>(
            `https://picarto.tv/images/_upload`,
            undefined,
            {
              type: 'multipart',
              data: {
                file_name: file,
                channel_id: channelId.toString(),
              },
              headers: {
                Authorization: `Bearer ${authRes.body.data.generateJwtToken.key}`,
              },
              requestOptions: {
                json: true,
              },
            },
          );
        }),
      )
    ).map(res => res.body.data.uid);

    this.checkCancelled(cancellationToken);

    const finishPost = await Http.post<{
      errors: any[];
      data: {
        createArtwork: {
          status: 'error';
          message: string;
          data: null;
        };
      };
    }>(`https://ptvintern.picarto.tv/ptvapi`, undefined, {
      type: 'json',
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
      requestOptions: {
        json: true,
      },
      data: {
        query:
          'mutation ($input: CreateArtworkInput) {\n  createArtwork(input: $input) {\n    status\n    message\n    data\n    __typename\n  }\n}',
        variables: {
          input: {
            album_id: data.options.folder || null,
            category: data.options.category || 'Creative',
            comment_setting: data.options.comments,
            description: Buffer.from(data.description).toString('base64'),
            download_original: data.options.downloadSource,
            main_image: uploadRes.body.data.uid,
            rating: this.getRating(data.rating),
            schedule_publishing_date: '',
            schedule_publishing_time: '',
            schedule_publishing_timezone: '',
            software: data.options.softwares.join(','),
            tags: this.formatTags(data.tags),
            title: data.title,
            variations: variations.join(','),
            visibility: data.options.visibility,
          },
        },
      },
    });

    this.verifyResponse(finishPost, 'Finish upload');
    if (
      finishPost.body?.data?.createArtwork?.status === 'error' ||
      finishPost.body.errors?.length
    ) {
      return Promise.reject(
        this.createPostResponse({
          message: finishPost.body?.data?.createArtwork?.message,
          additionalInfo: finishPost.body,
        }),
      );
    }

    return this.createPostResponse({});
  }

  formatTags(tags: string[]): string {
    return super
      .parseTags(tags, { spaceReplacer: '_', maxLength: 30, minLength: 1 })
      .filter(tag => tag.length >= 1)
      .slice(0, 30).join(',');
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
