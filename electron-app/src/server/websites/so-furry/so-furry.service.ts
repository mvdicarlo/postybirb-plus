import { Injectable } from '@nestjs/common';
import {
  DefaultOptions,
  FileRecord,
  FileSubmission,
  FileSubmissionType,
  Folder,
  PostResponse,
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
import { HTMLFormatParser } from 'src/server/description-parsing/html/html.parser';
import { PlaintextParser } from 'src/server/description-parsing/plaintext/plaintext.parser';
import { HttpExperimental } from 'src/server/utils/http-experimental';
import { FallbackInformation } from '../interfaces/fallback-information.interface';

interface SofurrySubmissionResponse {
  id: string;
  title: string;
  description: string | null;
  author: string;
  category: number;
  type: number;
  rating: number | null;
  status: number;
  privacy: string | null;
  content: string[];
  allowComments: boolean | null;
  allowDownloads: boolean | null;
  isWorkInProgress: boolean | null;
  isAdvert: boolean | null;
  optimize: boolean | null;
  pixelPerfect: boolean | null;
  onHold: boolean;
  onHoldReason: string | null;
  inReview: boolean | null;
  thumbUrl: string;
  coverUrl: string | null;
  artistTags: string[];
  publishedAt: string | null;
  importedFrom: string | null;
  buyAtVendor: string | null;
  buyAtUrl: string | null;
  customDownloadUrl: string | null;
  folders: string[];
}

interface SoFurryFileUploadResponse {
  contentId: string;
  title: string;
  description: string;
  body: {
    extension: string;
    displayUrl: string;
  };
  position: number;
  type: string;
}

interface SoFurryThumbnailUploadResponse {
  url: string;
}

@Injectable()
export class SoFurry extends Website {
  readonly BASE_URL: string = 'https://sofurry.com';
  readonly MAX_CHARS: number = undefined; // No Limit
  readonly acceptsFiles: string[] = ['png', 'jpeg', 'jpg', 'gif', 'swf', 'txt', 'mp3', 'mp4'];
  readonly usernameShortcuts = [
    {
      key: 'sf',
      url: 'https://sofurry.com/u/$1',
    },
  ];
  defaultDescriptionParser = PlaintextParser.parse;

  async checkLoginStatus(data: UserAccountEntity): Promise<LoginResponse> {
    const status: LoginResponse = { loggedIn: false, username: null };
    const res = await Http.get<string>(this.BASE_URL, data._id);

    // Check for logged in user via window.handle pattern
    const handleMatch = res.body.match(/window\.handle = "(.*)"/);
    if (handleMatch && handleMatch[1] !== 'null' && handleMatch[1]) {
      const username = handleMatch[1];

      // Extract CSRF token from meta tag
      const csrfMatch = res.body.match(/<meta name="csrf-token" content="([^"]+)"/);
      const csrfToken = csrfMatch ? csrfMatch[1] : undefined;
      if (csrfToken) {
        // Fetch folders
        await this.getFolders(data._id, csrfToken);
        status.loggedIn = true;
        status.username = username;
      }
    }
    return status;
  }

  /**
   * Fetch a fresh CSRF token from SoFurry.
   */
  private async fetchCsrfToken(partition: string): Promise<string | undefined> {
    const res = await Http.get<string>(this.BASE_URL, partition);

    const csrfMatch = res.body.match(/<meta name="csrf-token" content="([^"]+)"/);
    return csrfMatch ? csrfMatch[1] : undefined;
  }

  /**
   * Fetch user folders from SoFurry.
   */
  private async getFolders(profileId: string, csrfToken: string): Promise<void> {
    const res = await HttpExperimental.get<[{ id: string; name: string }]>(
      `${this.BASE_URL}/ui/folders`,
      {
        partition: profileId,
        headers: {
          'x-csrf-token': csrfToken,
        },
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

  getScalingOptions(file: FileRecord): ScalingOptions {
    return { maxSize: FileSize.MBtoBytes(50) };
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

  private getDefaultCategoryAndType(fileType: FileSubmissionType): {
    category: number;
    type: number;
  } {
    switch (fileType) {
      case FileSubmissionType.AUDIO:
        return { category: 40, type: 41 }; // Music -> Track
      case FileSubmissionType.TEXT:
        return { category: 20, type: 21 }; // Writing -> Short Story
      case FileSubmissionType.VIDEO:
        return { category: 50, type: 59 }; // Video -> Other
      case FileSubmissionType.IMAGE:
      default:
        return { category: 10, type: 11 }; // Artwork -> Drawing
    }
  }

  async postFileSubmission(
    cancellationToken: CancellationToken,
    data: FilePostData<SoFurryFileOptions>,
  ): Promise<PostResponse> {
    const csrf = await this.fetchCsrfToken(data.part.accountId);
    const createRes = await Http.put<SofurrySubmissionResponse>(
      `${this.BASE_URL}/ui/submission`,
      data.part.accountId,
      {
        type: 'json',
        data: {},
        headers: {
          'x-csrf-token': csrf,
        },
        requestOptions: {
          json: true,
        },
      },
    );

    if (!createRes.body?.id) {
      return Promise.reject(
        this.createPostResponse({
          message: 'Failed to create submission',
          additionalInfo: createRes.body,
        }),
      );
    }

    const submissionId = createRes.body.id;
    const files = [data.primary, ...data.additional];
    const contentIds: string[] = [];
    for (const file of files) {
      this.checkCancelled(cancellationToken);
      const uploadRes = await Http.post<SoFurryFileUploadResponse>(
        `${this.BASE_URL}/ui/submission/${submissionId}/content`,
        data.part.accountId,
        {
          type: 'multipart',
          data: {
            name: file.file.options.filename,
            file: file.file,
          },
          headers: {
            'x-csrf-token': csrf,
            referer: `${this.BASE_URL}/s/${submissionId}/edit`,
            origin: this.BASE_URL,
          },
          requestOptions: {
            json: true,
          },
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

    let thumbnailId: string | undefined;
    if (data.thumbnail) {
      const thumbRes = await Http.post<SoFurryThumbnailUploadResponse>(
        `${this.BASE_URL}/ui/submission/${submissionId}/thumbnail`,
        data.part.accountId,
        {
          type: 'multipart',
          data: {
            name: data.thumbnail.options.filename,
            file: data.thumbnail,
          },
          headers: {
            'x-csrf-token': csrf,
            referer: `${this.BASE_URL}/s/${submissionId}/edit`,
            origin: this.BASE_URL,
          },
        },
      );
      if (thumbRes.response.statusCode >= 400 || !thumbRes.body?.url) {
        return Promise.reject(
          this.createPostResponse({
            message: 'Failed to upload thumbnail',
            additionalInfo: thumbRes.body,
          }),
        );
      }
      thumbnailId = thumbRes.body.url;
    }

    const category = parseInt(data.options.category, 10);
    const type = parseInt(data.options.type, 10);

    const finalizeRes = await Http.post(
      `${this.BASE_URL}/ui/submission/${submissionId}`,
      data.part.accountId,
      {
        type: 'json',
        headers: {
          'x-csrf-token': csrf,
        },
        data: {
          title: data.title,
          category,
          type,
          rating: this.getRating(data.rating),
          privacy: data.options.privacy || '3',
          allowComments: data.options.allowComments ? 1 : 0,
          allowDownloads: data.options.allowDownloads ? 1 : 0,
          isWip: data.options.isWip ? 1 : 0,
          optimize: 1,
          pixelPerfect: data.options.pixelPerfectDisplay ? 1 : 0,
          isAdvert: data.options.intendedAsAdvertisement ? 1 : 0,
          description: data.description,
          artistTags: this.formatTags(data.tags),
          canPurchase: false,
          purchaseAtVendor: null,
          purchaseAtUrl: null,
          contentOrder: contentIds,
          thumbUrl: thumbnailId,
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

    return this.createPostResponse({
      source: `${this.BASE_URL}/s/${submissionId}`,
      additionalInfo: finalizeRes.body,
    });
  }

  fallbackFileParser(html: string): FallbackInformation {
    const t = HTMLFormatParser.parse(html);
    return { text: this.parseDescription(html), type: 'text/plain', extension: 'txt' };
  }

  formatTags(tags: string[]) {
    return tags;
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
    let maxMB: number = 50;
    if (FileSize.MBtoBytes(maxMB) < size) {
      if (
        isAutoscaling &&
        type === FileSubmissionType.IMAGE &&
        ImageManipulator.isMimeType(submission.primary.mimetype)
      ) {
        warnings.push(`${name} will be scaled down to ${maxMB}MB`);
      } else {
        problems.push(`SoFurry limits ${submission.primary.mimetype} to ${maxMB}MB`);
      }
    }

    return { problems, warnings };
  }
}
