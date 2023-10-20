import { Injectable } from '@nestjs/common';
import {
  DefaultOptions,
  FileRecord,
  FileSubmission,
  FileSubmissionType,
  FurryNetworkFileOptions,
  FurryNetworkNotificationOptions,
  PostResponse,
  Submission,
  SubmissionPart,
  SubmissionRating,
} from 'postybirb-commons';
import UserAccountEntity from 'src/server//account/models/user-account.entity';
import { MarkdownParser } from 'src/server/description-parsing/markdown/markdown.parser';
import ImageManipulator from 'src/server/file-manipulation/manipulators/image.manipulator';
import Http, { HttpResponse } from 'src/server/http/http.util';
import { CancellationToken } from 'src/server/submission/post/cancellation/cancellation-token';
import {
  FilePostData,
  PostFile,
} from 'src/server/submission/post/interfaces/file-post-data.interface';
import { PostData } from 'src/server/submission/post/interfaces/post-data.interface';
import { ValidationParts } from 'src/server/submission/validator/interfaces/validation-parts.interface';
import BrowserWindowUtil from 'src/server/utils/browser-window.util';
import FileSize from 'src/server/utils/filesize.util';
import WebsiteValidator from 'src/server/utils/website-validator.util';
import { LoginResponse } from '../interfaces/login-response.interface';
import { ScalingOptions } from '../interfaces/scaling-options.interface';
import { Website } from '../website.base';
import { FurryNetworkAccountData } from './furry-network-account.interface';

import _ from 'lodash';

@Injectable()
export class FurryNetwork extends Website {
  readonly BASE_URL: string = 'https://furrynetwork.com';
  readonly refreshBeforePost: boolean = true;
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
    const ls = await BrowserWindowUtil.getLocalStorage(data._id, this.BASE_URL, 2500);
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
    headers: any,
  ) {
    const chunkSize: number = 524288 / 2;
    const chunks = _.chunk(file.value, chunkSize);
    const fileType = encodeURIComponent(file.options.contentType);
    const responses: { body: string; status: number }[] = [];
    for (let i = 0; i < chunks.length; i++) {
      await new Promise(resolve => setTimeout(resolve, 2000));
      const chunk = chunks[i];
      const upload = {
        value: Buffer.from(chunk),
        options: file.options,
      };
      const url =
        `${this.BASE_URL}/api/submission/${character}/${type}/upload?` +
        `resumableChunkNumber=${i + 1}` +
        `&resumableChunkSize=${chunkSize}` +
        `&resumableCurrentChunkSize=${chunk.length}&resumableTotalSize=${
          file.value.length
        }&resumableType=${fileType}&resumableIdentifier=${file.value.length}-${encodeURIComponent(
          file.options.filename.replace('.', ''),
        )}&resumableFilename=${encodeURIComponent(
          file.options.filename,
        )}&resumableRelativePath=${encodeURIComponent(
          file.options.filename,
        )}&resumableTotalChunks=${chunks.length}`;
      const cmd = `
      var b64 = '${upload.value.toString('base64')}';
      var blob = Uint8Array.from(atob(b64), c => c.charCodeAt(0));
      var xhr = new XMLHttpRequest();
      xhr.open('POST', '${url}', false);
      xhr.setRequestHeader('Authorization', '${headers.Authorization}');
      xhr.setRequestHeader("Content-Type", "binary/octet-stream, application/json");
      xhr.send(blob);
      var body = xhr.response;
      Object.assign({}, { body: body, status: xhr.status })`;
      const create = await BrowserWindowUtil.runScriptOnPage<{ body: string; status: number }>(
        profileId,
        `${this.BASE_URL}`,
        cmd,
      );
      responses.push(create);
    }

    const res = JSON.parse(responses.find(r => r.body).body ?? '{}');
    if (!res || !res.id) {
      throw this.createPostResponse({ additionalInfo: res });
    }
    return res;
  }

  async uploadThumbnail(
    uploadId: string,
    profileId: string,
    character: string,
    file: PostFile,
    type: string,
    headers: any,
  ) {
    const url =
      `${this.BASE_URL}/api/submission/${character}/${type}/${uploadId}/thumbnail?` +
      'resumableChunkNumber=1' +
      `&resumableChunkSize=${file.value.length}` +
      `&resumableCurrentChunkSize=${file.value.length}
      &resumableTotalSize=${file.value.length}
      &resumableType=${encodeURIComponent(file.options.contentType)}
      &resumableIdentifier=${file.value.length}-${encodeURIComponent(file.options.filename).replace(
        '.',
        '',
      )}
      &resumableFilename=${encodeURIComponent(
        file.options.filename,
      )}&resumableRelativePath=${encodeURIComponent(file.options.filename)}
      &resumableTotalChunks=1`;
    const cmd = `
      var b64 = '${file.value.toString('base64')}';
      var blob = Uint8Array.from(atob(b64), c => c.charCodeAt(0));
      var xhr = new XMLHttpRequest();
      xhr.open('POST', '${url}', false);
      xhr.setRequestHeader('Authorization', '${headers.Authorization}');
      xhr.setRequestHeader("Content-Type", "binary/octet-stream, application/json");
      xhr.send(blob);
      var body = xhr.response;
      Object.assign({}, { body: body, status: xhr.status })`;
    return await BrowserWindowUtil.runScriptOnPage<{ body: string; status: number }>(
      profileId,
      `${this.BASE_URL}`,
      cmd,
    );
  }

  private async uploadJson(profileId: string, url: string, data: any, headers: any) {
    const cmd = `
      var data = ${JSON.stringify(data)};
      var xhr = new XMLHttpRequest();
      xhr.open('POST', '${url}', false);
      xhr.setRequestHeader('Authorization', '${headers.Authorization}');
      xhr.setRequestHeader("Content-Type", "application/json");
      xhr.send(JSON.stringify(data));
      var body = xhr.response;
      Object.assign({}, { body: body, status: xhr.status })`;
    return await BrowserWindowUtil.runScriptOnPage<{ body: string; status: number }>(
      profileId,
      `${this.BASE_URL}`,
      cmd,
    );
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
      const post = await this.uploadJson(data.part.accountId, url, form, headers);
      const postBody = JSON.parse(post.body);
      if (postBody.id && post.status <= 303) {
        return this.createPostResponse({});
      }
      return Promise.reject(
        this.createPostResponse({ message: post.body, additionalInfo: post.body }),
      );
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
            const thumb = await this.uploadThumbnail(
              upload.id,
              data.part.accountId,
              character,
              data.thumbnail,
              type,
              headers,
            );
            console.log(thumb);
          } catch (err) {
            console.error(err);
          }
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
    const post = await this.uploadJson(data.part.accountId, `${this.BASE_URL}/api/journal`, form, {
      Authorization: `Bearer ${accountData.access_token}`,
    });
    const postBody = JSON.parse(post.body);
    if (postBody.id && post.status <= 303) {
      return this.createPostResponse({});
    }
    return Promise.reject(
      this.createPostResponse({ message: post.body, additionalInfo: post.body }),
    );
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
          .replace(/(\(|\)|:|#|;|\]|\[|\.|')/g, '')
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
            problems.push(`Folder (${f}) not found.`);
          }
        });
      }
    }

    if (!WebsiteValidator.supportsFileType(submission.primary, this.acceptsFiles)) {
      if (submission.primary.type === FileSubmissionType.TEXT && !submission.fallback) {
        problems.push(`Currently supported file formats: ${this.acceptsFiles.join(', ')}`);
        problems.push('A fallback file is required.');
      } else if (submission.primary.type === FileSubmissionType.TEXT && submission.fallback) {
        warnings.push('The fallback text will be used.');
      } else {
        problems.push(`Currently supported file formats: ${this.acceptsFiles.join(', ')}`);
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
            problems.push(`Folder (${f}) not found.`);
          }
        });
      }
    }

    return { problems, warnings };
  }
}
