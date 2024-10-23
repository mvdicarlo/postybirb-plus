import { Injectable } from '@nestjs/common';
import {
  DefaultOptions,
  FileRecord,
  FileSubmission,
  FileSubmissionType,
  Folder,
  ItakuFileOptions,
  ItakuNotificationOptions,
  PostResponse,
  Submission,
  SubmissionPart,
  SubmissionRating,
} from 'postybirb-commons';
import UserAccountEntity from 'src/server/account/models/user-account.entity';
import { PlaintextParser } from 'src/server/description-parsing/plaintext/plaintext.parser';
import Http from 'src/server/http/http.util';
import { CancellationToken } from 'src/server/submission/post/cancellation/cancellation-token';
import {
  FilePostData,
  PostFile,
  PostFileRecord,
} from 'src/server/submission/post/interfaces/file-post-data.interface';
import { PostData } from 'src/server/submission/post/interfaces/post-data.interface';
import { ValidationParts } from 'src/server/submission/validator/interfaces/validation-parts.interface';
import BrowserWindowUtil from 'src/server/utils/browser-window.util';
import FileSize from 'src/server/utils/filesize.util';
import FormContent from 'src/server/utils/form-content.util';
import WebsiteValidator from 'src/server/utils/website-validator.util';
import { GenericAccountProp } from '../generic/generic-account-props.enum';
import { LoginResponse } from '../interfaces/login-response.interface';
import { ScalingOptions } from '../interfaces/scaling-options.interface';
import { Website } from '../website.base';
import _ from 'lodash';

@Injectable()
export class Itaku extends Website {
  BASE_URL: string = 'https://itaku.ee';
  readonly MAX_CHARS: number = 5000;
  acceptsFiles: string[] = ['jpeg', 'jpg', 'png', 'gif', 'webp', 'mp4', 'mov', 'webm'];
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

    this.storeAccountInformation(data._id, 'token', (ls.token as string).replace(/"/g, ''));

    const res = await Http.get<{ profile: { displayname: string; owner: number } }>(
      `${this.BASE_URL}/api/auth/user/`,
      data._id,
      {
        requestOptions: { json: true },
        headers: {
          Authorization: `Token ${this.getAccountInfo(data._id, 'token')}`,
        },
      },
    );
    const login: string = res.body.profile?.displayname;
    if (login) {
      status.loggedIn = true;
      status.username = login;
      this.storeAccountInformation(data._id, 'owner', res.body.profile.owner);
      await this.retrieveFolders(data._id, res.body.profile.owner);
    }

    return status;
  }

  getScalingOptions(file: FileRecord): ScalingOptions {
    return { maxSize: FileSize.MBtoBytes(file.type === FileSubmissionType.IMAGE ? 10 : 500) };
  }

  async retrieveFolders(id: string, ownerId: number): Promise<void> {
    const postFolderRes = await Http.get<{ id: string; num_images: number; title: string }[]>(
      `${this.BASE_URL}/api/post_folders/?owner=${ownerId}`,
      id,
      {
        requestOptions: { json: true },
        headers: {
          Authorization: `Token ${this.getAccountInfo(id, 'token')}`,
        },
      },
    );

    const postFolders: Folder[] = postFolderRes.body.map(f => ({
      value: f.title,
      label: f.title,
    }));
    this.storeAccountInformation(id, `POST-${GenericAccountProp.FOLDERS}`, postFolders);

    const galleryFolderRes = await Http.get<{
      count: number;
      results: { id: string; num_images: number; title: string }[];
    }>(`${this.BASE_URL}/api/galleries/?owner=${ownerId}&page_size=300`, id, {
      requestOptions: { json: true },
      headers: {
        Authorization: `Token ${this.getAccountInfo(id, 'token')}`,
      },
    });

    const galleryFolders: Folder[] = galleryFolderRes.body.results.map(f => ({
      value: f.title,
      label: f.title,
    }));
    this.storeAccountInformation(id, `GALLERY-${GenericAccountProp.FOLDERS}`, galleryFolders);
  }

  private convertRating(rating: SubmissionRating): string {
    switch (rating) {
      case SubmissionRating.GENERAL:
        return 'SFW';
      case SubmissionRating.MATURE:
        return 'Questionable';
      case SubmissionRating.ADULT:
      case SubmissionRating.EXTREME:
        return 'NSFW';
    }
  }

  async postFileSubmission(
    cancellationToken: CancellationToken,
    data: FilePostData<ItakuFileOptions>,
    accountData: any,
  ): Promise<PostResponse> {
    const files = [data.primary, ...data.additional];
    const haveMultipleFiles = files.length > 1;
    const imageIds = [];
    for (const file of files) {
      this.checkCancelled(cancellationToken);
      const body = await this.postImage(data, file, haveMultipleFiles);
      if (body.id) {
        imageIds.push(body.id);
      } else {
        return Promise.reject(this.createPostResponse({ additionalInfo: body }));
      }
    }

    if (haveMultipleFiles) {
      return this.makePost(data, imageIds);
    } else {
      return this.createPostResponse({
        source: `${this.BASE_URL}/images/${imageIds[0]}`,
      });
    }
  }

  async postImage(
    data: FilePostData<ItakuFileOptions>,
    fileRecord: PostFileRecord,
    haveMultipleFiles: boolean,
  ): Promise<any> {
    const postData: any = {
      title: data.title,
      description: data.description,
      sections: JSON.stringify(data.options.folders),
      maturity_rating: this.convertRating(data.rating),
      tags: JSON.stringify(data.tags.map(tag => ({ name: tag.substring(0, 59) }))),
      visibility: data.options.visibility,
    };

    if (!haveMultipleFiles && data.options.shareOnFeed) {
      postData.add_to_feed = 'true';
    }

    if (data.spoilerText) {
      postData.content_warning = data.spoilerText;
    }

    if (fileRecord.type === FileSubmissionType.IMAGE) {
      postData.image = fileRecord.file;
    } else {
      postData.video = fileRecord.file;
    }

    const post = await Http.post<{ id?: number }>(
      `${this.BASE_URL}/api/galleries/${
        data.primary.type === FileSubmissionType.IMAGE ? 'images' : 'videos'
      }/`,
      data.part.accountId,
      {
        type: 'multipart',
        data: postData,
        headers: {
          Authorization: `Token ${this.getAccountInfo(data.part.accountId, 'token')}`,
        },
        requestOptions: {
          json: true,
        },
      },
    );

    this.verifyResponse(post);
    return post.body;
  }

  async postNotificationSubmission(
    cancellationToken: CancellationToken,
    data: PostData<Submission, ItakuNotificationOptions>,
    accountData: any,
  ): Promise<PostResponse> {
    this.checkCancelled(cancellationToken);
    return this.makePost(data, []);
  }

  async makePost(
    data: PostData<Submission, ItakuFileOptions | ItakuNotificationOptions>,
    imageIds: number[],
  ): Promise<PostResponse> {
    const postData: any = {
      title: data.title,
      content: data.description,
      folders: data.options.folders,
      gallery_images: imageIds,
      maturity_rating: this.convertRating(data.rating),
      tags: data.tags.map(tag => ({ name: tag.substring(0, 59) })),
      visibility: data.options.visibility,
    };

    if (data.options.spoilerText) {
      postData.content_warning = data.options.spoilerText;
    }

    const post = await Http.post<{ id: number }>(
      `${this.BASE_URL}/api/posts/`,
      data.part.accountId,
      {
        type: 'json',
        data: postData,
        headers: {
          Authorization: `Token ${this.getAccountInfo(data.part.accountId, 'token')}`,
        },
        requestOptions: {
          json: true,
        },
      },
    );

    this.verifyResponse(post);
    if (!post.body.id) {
      return Promise.reject(this.createPostResponse({ additionalInfo: post.body }));
    }
    return this.createPostResponse({ source: `${this.BASE_URL}/posts/${post.body.id}` });
  }

  validateFileSubmission(
    submission: FileSubmission,
    submissionPart: SubmissionPart<ItakuFileOptions>,
    defaultPart: SubmissionPart<DefaultOptions>,
    description: string,
  ): ValidationParts {
    const problems: string[] = [];
    const warnings: string[] = [];

    if (this.stripTagsShortcut(description).length > this.MAX_CHARS) {
      problems.push(`Max description length allowed is 5000 characters.`);
    }

    if (FormContent.getTags(defaultPart.data.tags, submissionPart.data.tags).length < 5) {
      problems.push('Requires at least 5 tags.');
    }

    const { type, size, name } = submission.primary;

    if (!WebsiteValidator.supportsFileType(submission.primary, this.acceptsFiles)) {
      problems.push(`Currently supported file formats: ${this.acceptsFiles.join(', ')}`);
    }

    if (type === FileSubmissionType.IMAGE && FileSize.MBtoBytes(10) < size) {
      warnings.push(`${name} will be scaled down to 10MB`);
    } else if (type === FileSubmissionType.VIDEO && FileSize.MBtoBytes(500) < size) {
      problems.push(`Itaku limits ${submission.primary.mimetype} to 500MB`);
    }

    if (submission.additional?.length && !submissionPart.data.shareOnFeed) {
      problems.push(`Posting multiple images requires share on feed to be enabled`);
    }

    const spoilerText = FormContent.getSpoilerText(defaultPart.data, submissionPart.data);
    if (spoilerText.length > 30) {
      problems.push(`Max content warning length allowed is 30 characters`);
    }

    return { problems, warnings };
  }

  validateNotificationSubmission(
    submission: Submission,
    submissionPart: SubmissionPart<ItakuNotificationOptions>,
    defaultPart: SubmissionPart<DefaultOptions>,
    description: string,
  ): ValidationParts {
    const problems: string[] = [];
    const warnings: string[] = [];

    if (!description) {
      problems.push('Description required');
    }

    if (this.stripTagsShortcut(description).length > this.MAX_CHARS) {
      problems.push(`Max description length allowed is 5000 characters.`);
    }

    return { problems, warnings };
  }
}
