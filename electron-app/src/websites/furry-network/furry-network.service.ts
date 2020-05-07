import { Injectable } from '@nestjs/common';
import UserAccountEntity from 'src/account/models/user-account.entity';
import { MarkdownParser } from 'src/description-parsing/markdown/markdown.parser';
import ImageManipulator from 'src/file-manipulation/manipulators/image.manipulator';
import Http from 'src/http/http.util';
import { SubmissionRating } from 'src/submission/enums/submission-rating.enum';
import { FileSubmissionType } from 'src/submission/file-submission/enums/file-submission-type.enum';
import { FileRecord } from 'src/submission/file-submission/interfaces/file-record.interface';
import { FileSubmission } from 'src/submission/file-submission/interfaces/file-submission.interface';
import { Submission } from 'src/submission/interfaces/submission.interface';
import { CancellationToken } from 'src/submission/post/cancellation/cancellation-token';
import { FilePostData, PostFile } from 'src/submission/post/interfaces/file-post-data.interface';
import { PostData } from 'src/submission/post/interfaces/post-data.interface';
import { PostResponse } from 'src/submission/post/interfaces/post-response.interface';
import { DefaultOptions } from 'src/submission/submission-part/interfaces/default-options.interface';
import { SubmissionPart } from 'src/submission/submission-part/interfaces/submission-part.interface';
import { ValidationParts } from 'src/submission/validator/interfaces/validation-parts.interface';
import BrowserWindowUtil from 'src/utils/browser-window.util';
import FileSize from 'src/utils/filesize.util';
import WebsiteValidator from 'src/utils/website-validator.util';
import { LoginResponse } from '../interfaces/login-response.interface';
import { ScalingOptions } from '../interfaces/scaling-options.interface';
import { Website } from '../website.base';
import { FurryNetworkAccountData } from './furry-network-account.interface';
import {
  FurryNetworkDefaultFileOptions,
  FurryNetworkDefaultNotificationOptions,
} from './furry-network.defaults';
import {
  FurryNetworkFileOptions,
  FurryNetworkNotificationOptions,
} from './furry-network.interface';
import _ = require('lodash');

@Injectable()
export class FurryNetwork extends Website {
  readonly BASE_URL: string = 'https://furrynetwork.com';
  readonly acceptsFiles: string[] = [
    'png',
    'jpeg',
    'jpg',
    'mp3',
    'mp4',
    'webm',
    'swf',
    'gif',
    'wav',
    'txt',
    'plain',
  ];
  readonly fileSubmissionOptions: FurryNetworkFileOptions = FurryNetworkDefaultFileOptions;
  readonly notificationSubmissionOptions: FurryNetworkNotificationOptions = FurryNetworkDefaultNotificationOptions;
  readonly defaultDescriptionParser = MarkdownParser.parse;
  private readonly collections: string[] = ['artwork', 'story', 'multimedia', 'journals'];

  readonly usernameShortcuts = [
    {
      key: 'fn',
      url: 'https://furrynetwork.com/$1',
    },
  ];

  async checkLoginStatus(data: UserAccountEntity): Promise<LoginResponse> {
    const status: LoginResponse = { loggedIn: false, username: null };
    const ls = await BrowserWindowUtil.getLocalStorage(data._id, this.BASE_URL);
    if (ls.token && ls.user) {
      status.loggedIn = true;

      const token: FurryNetworkAccountData = JSON.parse(ls.token);
      const user = JSON.parse(ls.user);

      status.username = user.email;
      status.data = token;
      this.storeAccountInformation(data._id, 'user', user);
      try {
        await Promise.all(
          user.characters.map(character =>
            this.loadCollections(data._id, token.access_token, character.name),
          ),
        );
      } catch {}
    }
    return status;
  }

  private async loadCollections(profileId: string, token: string, character: string) {
    const collection = {
      [FileSubmissionType.IMAGE]: [], // Artwork
      [FileSubmissionType.TEXT]: [], // Story
      [FileSubmissionType.AUDIO]: [], // Multimedia
      [FileSubmissionType.VIDEO]: [], // Multimedia
      NOTIFICATION: [],
    };

    for (const collectionType of this.collections) {
      const res = await Http.get<Array<{ id: number; character_id: number; name: string }>>(
        `${this.BASE_URL}/api/character/${character}/${collectionType}/collections`,
        profileId,
        {
          requestOptions: { json: true },
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      switch (collectionType) {
        case 'artwork':
          collection.IMAGE = res.body;
          break;
        case 'story':
          collection.TEXT = res.body;
          break;
        case 'journals':
          collection.NOTIFICATION = res.body;
          break;
        case 'multimedia':
          collection.VIDEO = res.body;
          collection.AUDIO = res.body;
          break;
      }
    }

    this.storeAccountInformation(profileId, `${character}-collections`, collection);
  }

  getScalingOptions(file: FileRecord): ScalingOptions {
    return { maxSize: FileSize.MBtoBytes(32) };
  }

  private generateUploadUrl(character: string, file: PostFile, type: string): string {
    let uploadURL = '';
    if (type === 'story') {
      uploadURL = `${this.BASE_URL}/api/story`;
    } else {
      const size = file.value.length;
      const name = file.options.filename.replace('.', '');
      uploadURL =
        `${this.BASE_URL}/api/submission/${character}/${type}/upload?` +
        'resumableChunkNumber=1' +
        `&resumableChunkSize=${size}` +
        `&resumableCurrentChunkSize=${size}&resumableTotalSize=${size}&resumableType=${file.options.contentType}&resumableIdentifier=${size}-${name}&resumableFilename=${name}&resumableRelativePath=${name}&resumableTotalChunks=1`;
    }

    return uploadURL;
  }

  private generatePostData(
    data: FilePostData<FurryNetworkFileOptions>,
    type: string,
    file: PostFile,
  ): object {
    const { options } = data;
    if (type === 'story') {
      return {
        collections: options.folders || [],
        description: data.description || data.title,
        status: 'public',
        title: data.title,
        tags: this.formatTags(data.tags),
        rating: this.getRating(data.rating),
        community_tags_allowed: options.communityTags,
        content: file.value.toString(),
      };
    } else {
      return {
        collections: options.folders || [],
        description: data.description,
        status: 'public',
        title: data.title,
        tags: this.formatTags(data.tags),
        rating: this.getRating(data.rating),
        community_tags_allowed: options.communityTags,
        publish: true,
      };
    }
  }

  private async postFileChunks(
    profileId: string,
    character: string,
    file: PostFile,
    type: string,
    headers: object,
  ) {
    const chunkSize: number = 524288;
    const chunks = _.chunk(file.value, chunkSize);
    const fileType = encodeURIComponent(file.options.contentType);
    const responses = await Promise.all(
      chunks.map((chunk, i) => {
        const upload = {
          value: Buffer.from(chunk),
          options: file.options,
        };
        return Http.post<any>(
          `${this.BASE_URL}/api/submission/${character}/${type}/upload?` +
            `resumableChunkNumber=${i + 1}` +
            `&resumableChunkSize=${chunkSize}` +
            `&resumableCurrentChunkSize=${chunk.length}&resumableTotalSize=${
              file.value.length
            }&resumableType=${fileType}&resumableIdentifier=${
              file.value.length
            }-${encodeURIComponent(
              file.options.filename.replace('.', ''),
            )}&resumableFilename=${encodeURIComponent(
              file.options.filename,
            )}&resumableRelativePath=${encodeURIComponent(
              file.options.filename,
            )}&resumableTotalChunks=${chunks.length}`,
          profileId,
          {
            type: 'multipart',
            headers,
            requestOptions: { json: true },
            data: { file: upload },
          },
        );
      }),
    );

    const res = responses.shift();
    if (!res.body.id) {
      throw this.createPostResponse({ additionalInfo: res.body });
    }
    return res.body;
  }

  async postFileSubmission(
    cancellationToken: CancellationToken,
    data: FilePostData<FurryNetworkFileOptions>,
    accountData: FurryNetworkAccountData,
  ): Promise<PostResponse> {
    const { options } = data;
    const type = this.getContentType(
      data.primary.type,
      data.primary.file.options.contentType === 'image/gif',
    );

    let file = data.primary.file;
    if (data.primary.type === FileSubmissionType.TEXT) {
      if (!WebsiteValidator.supportsFileType(data.submission.primary, this.acceptsFiles)) {
        file = data.fallback;
      }
    }

    let character = options.profile;
    if (!character) {
      const user = this.getAccountInfo(data.part.accountId, 'user');
      character = user.characters[0].name;
    }
    const url = this.generateUploadUrl(character, file, type);
    const headers = { Authorization: `Bearer ${accountData.access_token}` };
    const form = this.generatePostData(data, type, file);

    if (type === 'story') {
      this.checkCancelled(cancellationToken);
      const post = await Http.post<{ id: number }>(url, data.part.accountId, {
        type: 'json',
        data: form,
        headers,
        requestOptions: { json: true },
      });

      this.verifyResponse(post, 'Verify story post');
      if (post.body.id) {
        return this.createPostResponse({});
      }
      return Promise.reject(this.createPostResponse({ additionalInfo: post.body }));
    } else {
      this.checkCancelled(cancellationToken);
      const upload = await this.postFileChunks(data.part.accountId, character, file, type, headers);

      this.checkCancelled(cancellationToken);
      const post = await Http.patch<{ id: number }>(
        `${this.BASE_URL}/api/${type}/${upload.id}`,
        data.part.accountId,
        {
          type: 'json',
          data: form,
          requestOptions: { json: true },
          headers,
        },
      );

      this.verifyResponse(post);
      if (post.body.id) {
        if (type === 'multimedia' && data.thumbnail) {
          try {
            await Http.post(
              `${this.BASE_URL}/api/submission/${character}/${type}/${upload.id}/thumbnail?` +
                'resumableChunkNumber=1' +
                `&resumableChunkSize=${data.thumbnail.value.length}` +
                `&resumableCurrentChunkSize=${data.thumbnail.value.length}
            &resumableTotalSize=${data.thumbnail.value.length}
            &resumableType=${encodeURIComponent(data.thumbnail.options.contentType)}
            &resumableIdentifier=${data.thumbnail.value.length}-${encodeURIComponent(
                  data.thumbnail.options.filename,
                ).replace('.', '')}
            &resumableFilename=${encodeURIComponent(
              data.thumbnail.options.filename,
            )}&resumableRelativePath=${encodeURIComponent(data.thumbnail.options.filename)}
            &resumableTotalChunks=1`,
              data.part.accountId,
              {
                type: 'multipart',
                headers,
                data: {
                  file: data.thumbnail,
                },
              },
            );
          } catch {}
        }

        return this.createPostResponse({ source: `${this.BASE_URL}/${type}/${post.body.id}` });
      }

      return Promise.reject(this.createPostResponse({ additionalInfo: post.body }));
    }
  }

  async postNotificationSubmission(
    cancellationToken: CancellationToken,
    data: PostData<Submission, FurryNetworkNotificationOptions>,
    accountData: FurryNetworkAccountData,
  ): Promise<PostResponse> {
    const form = {
      community_tags_allowed: false,
      collections: [],
      content: data.description,
      description: data.description.split('.')[0],
      rating: this.getRating(data.rating),
      title: data.title,
      subtitle: '',
      tags: this.formatTags(data.tags),
      status: 'public',
    };

    this.checkCancelled(cancellationToken);
    const post = await Http.post<{ id: number }>(
      `${this.BASE_URL}/api/journal`,
      data.part.accountId,
      {
        type: 'json',
        data: form,
        requestOptions: { json: true },
        headers: {
          Authorization: `Bearer ${accountData.access_token}`,
        },
      },
    );

    this.verifyResponse(post, 'Verify post');
    if (post.body.id) {
      return this.createPostResponse({});
    }

    return Promise.reject(this.createPostResponse({ additionalInfo: post.body }));
  }

  private getContentType(type: FileSubmissionType, isGIF: boolean): any {
    if (type === FileSubmissionType.IMAGE && !isGIF) return 'artwork';
    if (type === FileSubmissionType.TEXT) return 'story';
    if (type === FileSubmissionType.VIDEO || type === FileSubmissionType.AUDIO || isGIF)
      return 'multimedia';
    return 'artwork';
  }

  private getRating(rating: SubmissionRating) {
    switch (rating) {
      case SubmissionRating.MATURE:
        return 1;
      case SubmissionRating.ADULT:
      case SubmissionRating.EXTREME:
        return 2;
      case SubmissionRating.GENERAL:
      default:
        return 0;
    }
  }

  formatTags(tags: string[]) {
    return super
      .formatTags(tags, { spaceReplacer: '-', maxLength: 30, minLength: 3 })
      .map(tag =>
        tag
          .replace(/(\(|\)|:|#|;|\]|\[|')/g, '')
          .replace(/(\\|\/)/g, '-')
          .replace(/\?/g, 'unknown'),
      )
      .filter(tag => tag.length >= 3)
      .slice(0, 30);
  }

  validateFileSubmission(
    submission: FileSubmission,
    submissionPart: SubmissionPart<FurryNetworkFileOptions>,
    defaultPart: SubmissionPart<DefaultOptions>,
  ): ValidationParts {
    const problems: string[] = [];
    const warnings: string[] = [];
    const isAutoscaling: boolean = submissionPart.data.autoScale;

    if (!submissionPart.data.profile) {
      warnings.push('Default profile will be used');
    }

    if (submissionPart.data.folders.length) {
      let type = submission.primary.type;
      if (submission.primary.mimetype === 'image/gif') {
        type = FileSubmissionType.VIDEO;
      }
      const collections = this.getAccountInfo(
        submissionPart.accountId,
        `${submissionPart.data.profile}-collections`,
      );
      if (collections && collections[type]) {
        submissionPart.data.folders.forEach(f => {
          const found = collections[type].find(c => c.id === f);
          if (!found) {
            problems.push(`Folder not found: ${f}`);
          }
        });
      }
    }

    if (!WebsiteValidator.supportsFileType(submission.primary, this.acceptsFiles)) {
      if (submission.primary.type === FileSubmissionType.TEXT && !submission.fallback) {
        problems.push(
          `Does not support file format: (${submission.primary.name}) ${submission.primary.mimetype}.`,
        );
        problems.push('A fallback file is required.');
      } else if (submission.primary.type === FileSubmissionType.TEXT && submission.fallback) {
        warnings.push('The fallback text will be used.');
      } else {
        problems.push(
          `Does not support file format: (${submission.primary.name}) ${submission.primary.mimetype}.`,
        );
      }
    }

    const { type, size, name, mimetype } = submission.primary;
    let maxMB: number = 32;
    if (type === FileSubmissionType.VIDEO || mimetype === 'image/gif') {
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
        problems.push(`Furry Network limits ${submission.primary.mimetype} to ${maxMB}MB`);
      }
    }

    return { problems, warnings };
  }

  validateNotificationSubmission(
    submission: Submission,
    submissionPart: SubmissionPart<FurryNetworkNotificationOptions>,
    defaultPart: SubmissionPart<DefaultOptions>,
  ): ValidationParts {
    const problems = [];
    const warnings = [];

    if (!submissionPart.data.profile) {
      warnings.push('Default profile will be used');
    }

    if (submissionPart.data.folders.length) {
      const type = 'NOTIFICATION';
      const collections = this.getAccountInfo(
        submissionPart.accountId,
        `${submissionPart.data.profile}-collections`,
      );
      if (collections && collections[type]) {
        submissionPart.data.folders.forEach(f => {
          const found = collections[type].find(c => c.id === f);
          if (!found) {
            problems.push(`Folder not found: ${f}`);
          }
        });
      }
    }

    return { problems, warnings };
  }
}
