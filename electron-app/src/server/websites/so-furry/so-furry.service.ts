import { Injectable } from '@nestjs/common';
import {
  DefaultOptions,
  FileRecord,
  FileSubmission,
  FileSubmissionType,
  Folder,
  PostResponse,
  SoFurryAccountData,
  SoFurryFileOptions,
  SubmissionPart,
  SubmissionRating,
} from 'postybirb-commons';
import UserAccountEntity from 'src/server//account/models/user-account.entity';
import ImageManipulator from 'src/server/file-manipulation/manipulators/image.manipulator';
import Http from 'src/server/http/http.util';
import { CancellationToken } from 'src/server/submission/post/cancellation/cancellation-token';
import { FilePostData } from 'src/server/submission/post/interfaces/file-post-data.interface';
import { ValidationParts } from 'src/server/submission/validator/interfaces/validation-parts.interface';
import FileSize from 'src/server/utils/filesize.util';
import FormContent from 'src/server/utils/form-content.util';
import WebsiteValidator from 'src/server/utils/website-validator.util';
import { GenericAccountProp } from '../generic/generic-account-props.enum';
import { LoginResponse } from '../interfaces/login-response.interface';
import { ScalingOptions } from '../interfaces/scaling-options.interface';
import { Website } from '../website.base';

import _ from 'lodash';
import { PlaintextParser } from 'src/server/description-parsing/plaintext/plaintext.parser';
import { FallbackInformation } from '../interfaces/fallback-information.interface';

interface SoFurryUserResponse {
  handle: string;
  username: string;
}

interface SoFurrySubmissionResponse {
  id: string;
  title: string;
  status: number;
  privacy: string | null;
}

interface SoFurryFileUploadResponse {
  contentId: string;
  title: string | null;
  description: string | null;
  body: {
    url: string;
  };
  position: number;
  type: string;
}

@Injectable()
export class SoFurry extends Website {
  readonly BASE_URL: string = 'https://sofurry.com';
  readonly API_BASE_URL: string = 'https://api.sofurry.com';
  readonly MAX_CHARS: number = undefined; // No Limit
  readonly MAX_MB: number = 100;
  readonly acceptsFiles: string[] = [
    'png',
    'jpeg',
    'jpg',
    'gif',
    'webp',
    'txt',
    'pdf',
    'mp3',
    'mp4',
  ];
  readonly usernameShortcuts = [
    {
      key: 'sf',
      url: 'https://sofurry.com/u/$1',
    },
  ];
  defaultDescriptionParser = PlaintextParser.parse;

  private getAuthHeaders(token: string): Record<string, string> {
    return {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
    };
  }

  async checkLoginStatus(data: UserAccountEntity): Promise<LoginResponse> {
    const status: LoginResponse = { loggedIn: false, username: null };
    const accountData: SoFurryAccountData = data.data;
    if (!accountData?.token) {
      return status;
    }

    try {
      const res = await Http.get<SoFurryUserResponse>(
        `${this.API_BASE_URL}/v1/user/me`,
        undefined,
        {
          skipCookies: true,
          requestOptions: { json: true },
          headers: this.getAuthHeaders(accountData.token),
        },
      );

      if (res.response.statusCode === 200 && res.body?.username) {
        status.loggedIn = true;
        status.username = res.body.username;
        this.storeAccountInformation(data._id, 'username', status.username);
        await this.getFolders(data._id, accountData.token);
      }
    } catch (err) {
      this.logger.error(err);
    }

    return status;
  }

  /**
   * Fetch user folders from the SoFurry API.
   */
  private async getFolders(profileId: string, token: string): Promise<void> {
    const res = await Http.get<{ id: string; name: string }[]>(
      `${this.API_BASE_URL}/v1/folders`,
      undefined,
      {
        skipCookies: true,
        requestOptions: { json: true },
        headers: this.getAuthHeaders(token),
      },
    );

    const { body } = res;
    const folders: Folder[] = [];
    if (Array.isArray(body)) {
      body.forEach(folder => {
        folders.push({
          label: folder.name,
          value: folder.id,
        });
      });
    }

    this.storeAccountInformation(profileId, GenericAccountProp.FOLDERS, folders);
  }

  transformAccountData(data: SoFurryAccountData) {
    return {
      username: data?.username,
    };
  }

  getScalingOptions(file: FileRecord): ScalingOptions {
    return { maxSize: FileSize.MBtoBytes(this.MAX_MB) };
  }

  private getRating(rating: SubmissionRating): number {
    switch (rating) {
      case SubmissionRating.EXTREME:
      case SubmissionRating.ADULT:
        return 20; // Adult
      case SubmissionRating.MATURE:
        return 10; // Mature
      case SubmissionRating.GENERAL:
      default:
        return 0; // Clean
    }
  }

  async postFileSubmission(
    cancellationToken: CancellationToken,
    data: FilePostData<SoFurryFileOptions>,
    accountData: SoFurryAccountData,
  ): Promise<PostResponse> {
    const headers = this.getAuthHeaders(accountData.token);

    // Step 1: Create an empty draft submission.
    this.checkCancelled(cancellationToken);
    const createRes = await Http.put<SoFurrySubmissionResponse>(
      `${this.API_BASE_URL}/v1/submission`,
      undefined,
      {
        type: 'json',
        data: {},
        skipCookies: true,
        requestOptions: { json: true },
        headers,
      },
    );

    if (createRes.response.statusCode >= 400 || !createRes.body?.id) {
      return Promise.reject(
        this.createPostResponse({
          message: 'Failed to create submission',
          additionalInfo: createRes.body,
        }),
      );
    }

    const submissionId = createRes.body.id;

    // Step 2: Upload each file (sequentially to preserve content ordering).
    const files = [data.primary, ...data.additional];
    const contentIds: string[] = [];
    for (const file of files) {
      this.checkCancelled(cancellationToken);
      const uploadRes = await Http.post<SoFurryFileUploadResponse>(
        `${this.API_BASE_URL}/v1/submission/${submissionId}/content`,
        undefined,
        {
          type: 'multipart',
          data: {
            file: file.file,
          },
          skipCookies: true,
          requestOptions: { json: true },
          headers,
        },
      );

      if (uploadRes.response.statusCode >= 400 || !uploadRes.body?.contentId) {
        return Promise.reject(
          this.createPostResponse({
            message: 'Failed to upload file',
            additionalInfo: uploadRes.body,
          }),
        );
      }
      contentIds.push(uploadRes.body.contentId);
    }

    // Step 3: Finalize the submission with metadata.
    const category = parseInt(data.options.category, 10);
    const type = parseInt(data.options.type, 10);

    this.checkCancelled(cancellationToken);
    const finalizeRes = await Http.post<SoFurrySubmissionResponse>(
      `${this.API_BASE_URL}/v1/submission/${submissionId}`,
      undefined,
      {
        type: 'json',
        skipCookies: true,
        requestOptions: { json: true },
        headers,
        data: {
          title: data.title,
          category,
          type,
          rating: this.getRating(data.rating),
          privacy: parseInt(data.options.privacy, 10) || 3,
          allowComments: data.options.allowComments,
          allowDownloads: data.options.allowDownloads,
          isWip: data.options.isWip,
          optimize: true,
          pixelPerfect: data.options.pixelPerfectDisplay,
          isAdvert: data.options.intendedAsAdvertisement,
          description: data.description,
          artistTags: this.formatTags(data.tags),
          canPurchase: false,
          contentOrder: contentIds,
        },
      },
    );

    if (finalizeRes.response.statusCode >= 400) {
      return Promise.reject(
        this.createPostResponse({
          message: 'Failed to finalize submission',
          additionalInfo: finalizeRes.body,
        }),
      );
    }

    // Step 4: Add the submission to a folder (optional, non-fatal).
    if (data.options.folder && data.options.folder !== '0') {
      try {
        const folderRes = await Http.post(
          `${this.API_BASE_URL}/v1/folder/${data.options.folder}/${submissionId}`,
          undefined,
          {
            type: 'form',
            data: {},
            skipCookies: true,
            requestOptions: { json: true },
            headers,
          },
        );
        if (folderRes.response.statusCode >= 400) {
          this.logger.warn(`Failed to add submission to folder ${data.options.folder}`);
        }
      } catch (err) {
        this.logger.warn(`Failed to add submission to folder ${data.options.folder}`);
      }
    }

    return this.createPostResponse({
      source: `${this.BASE_URL}/s/${submissionId}`,
      additionalInfo: finalizeRes.body,
    });
  }

  fallbackFileParser(html: string): FallbackInformation {
    return { text: this.parseDescription(html), type: 'text/plain', extension: 'txt' };
  }

  formatTags(tags: string[]) {
    return tags.map(tag => tag.replace(/_/g, ' ').trim());
  }

  validateFileSubmission(
    submission: FileSubmission,
    submissionPart: SubmissionPart<SoFurryFileOptions>,
    defaultPart: SubmissionPart<DefaultOptions>,
  ): ValidationParts {
    const problems: string[] = [];
    const warnings: string[] = [];
    const isAutoscaling: boolean = submissionPart.data.autoScale;

    if (FormContent.getTags(defaultPart.data.tags, submissionPart.data.tags).length < 2) {
      problems.push('Requires at least 2 tags.');
    }

    if (submissionPart.data.folder && submissionPart.data.folder !== '0') {
      const folders: Folder[] = _.get(
        this.accountInformation.get(submissionPart.accountId),
        GenericAccountProp.FOLDERS,
        [],
      );
      if (!folders.find(f => f.value === submissionPart.data.folder)) {
        warnings.push(`Folder (${submissionPart.data.folder}) not found.`);
      }
    }

    if (!submissionPart.data.category || !submissionPart.data.type) {
      problems.push(`Category and Type are required`);
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

    const { type, size, name } = submission.primary;
    if (FileSize.MBtoBytes(this.MAX_MB) < size) {
      if (
        isAutoscaling &&
        type === FileSubmissionType.IMAGE &&
        ImageManipulator.isMimeType(submission.primary.mimetype)
      ) {
        warnings.push(`${name} will be scaled down to ${this.MAX_MB}MB`);
      } else {
        problems.push(`SoFurry limits ${submission.primary.mimetype} to ${this.MAX_MB}MB`);
      }
    }

    return { problems, warnings };
  }
}
