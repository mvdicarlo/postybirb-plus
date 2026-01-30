import { Injectable } from '@nestjs/common';
import _ from 'lodash';
import {
  DefaultOptions,
  FileRecord,
  FileSubmission,
  FileSubmissionType,
  Folder,
  PiczelFileOptions,
  PostResponse,
  SubmissionPart,
  SubmissionRating,
} from 'postybirb-commons';
import UserAccountEntity from 'src/server//account/models/user-account.entity';
import { HTMLFormatParser } from 'src/server/description-parsing/html/html.parser';
import { MarkdownParser } from 'src/server/description-parsing/markdown/markdown.parser';
import ImageManipulator from 'src/server/file-manipulation/manipulators/image.manipulator';
import Http from 'src/server/http/http.util';
import { CancellationToken } from 'src/server/submission/post/cancellation/cancellation-token';
import { FilePostData } from 'src/server/submission/post/interfaces/file-post-data.interface';
import { ValidationParts } from 'src/server/submission/validator/interfaces/validation-parts.interface';
import FileSize from 'src/server/utils/filesize.util';
import WebsiteValidator from 'src/server/utils/website-validator.util';
import { LoginResponse } from 'src/server/websites/interfaces/login-response.interface';
import { Website } from 'src/server/websites/website.base';
import { GenericAccountProp } from '../generic/generic-account-props.enum';
import { ScalingOptions } from '../interfaces/scaling-options.interface';
import parse from 'node-html-parser';

@Injectable()
export class Piczel extends Website {
  readonly BASE_URL: string = 'https://piczel.tv';
  readonly MAX_CHARS: number = undefined; // No Limit
  readonly acceptsFiles: string[] = ['png', 'jpeg', 'jpg', 'gif'];
  readonly acceptsAdditionalFiles: boolean = true;
  readonly defaultDescriptionParser = MarkdownParser.parse;

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
      const $ = parse(res.body);
      const preloadedData = JSON.parse(
        $.getElementById('_R_').textContent.split(
          'window.__PRELOADED_STATE__ = ',
        )[1],
      );
      const { username } = preloadedData.currentUser.data;
      status.username = username;
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

    const folders: Folder[] = res.body.map(f => ({
      value: f.id.toString(),
      label: f.name,
    }));

    this.storeAccountInformation(profileId, GenericAccountProp.FOLDERS, folders);
  }

  getScalingOptions(file: FileRecord): ScalingOptions {
    return { maxSize: FileSize.MBtoBytes(10) };
  }

  parseDescription(text: string): string {
    text = text.replace(/<br(\/|\s\/){0,1}>/g, '\n');
    HTMLFormatParser.BLOCKS.forEach(block => {
      text = text
        .replace(new RegExp(`</${block}>`, 'g'), '')
        .replace(new RegExp(`<${block}.*?>`, 'g'), '');
    });
    return text.replace(/<hr\s{0,1}\/{0,1}>/g, '------------');
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
      uid: userData.auth.uid,
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

    const maxMB: number = 10;
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
