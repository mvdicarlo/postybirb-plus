import { Injectable } from '@nestjs/common';
import generator, { Entity, Response } from 'megalodon';
import {
  DefaultOptions,
  FileRecord,
  FileSubmission,
  FileSubmissionType,
  MissKeyAccountData,
  MissKeyFileOptions,
  MissKeyNotificationOptions,
  PostResponse,
  Submission,
  SubmissionPart,
  SubmissionRating,
} from 'postybirb-commons';
import { ScalingOptions } from '../interfaces/scaling-options.interface';
import UserAccountEntity from 'src/server//account/models/user-account.entity';
import { PlaintextParser } from 'src/server/description-parsing/plaintext/plaintext.parser';
import ImageManipulator from 'src/server/file-manipulation/manipulators/image.manipulator';
import { CancellationToken } from 'src/server/submission/post/cancellation/cancellation-token';
import { FilePostData } from 'src/server/submission/post/interfaces/file-post-data.interface';
import { PostData } from 'src/server/submission/post/interfaces/post-data.interface';
import { ValidationParts } from 'src/server/submission/validator/interfaces/validation-parts.interface';
import FileSize from 'src/server/utils/filesize.util';
import FormContent from 'src/server/utils/form-content.util';
import WebsiteValidator from 'src/server/utils/website-validator.util';
import { LoginResponse } from '../interfaces/login-response.interface';
import { Website } from '../website.base';
import _ from 'lodash';
import { FileManagerService } from 'src/server/file-manager/file-manager.service';

const INFO_KEY = 'INSTANCE INFO';

type MissKeyInstanceInfo = {
  configuration: {
    statuses: {
      max_characters: number;
      max_media_attachments: number;
    };
    media_attachments: {
      supported_mime_types: string[];
      image_size_limit: number;
      video_size_limit: number;
    };
  };
};

@Injectable()
export class MissKey extends Website {
  constructor(private readonly fileRepository: FileManagerService) {
    super();
  }
  readonly BASE_URL: string;
  readonly enableAdvertisement = false;
  readonly acceptsAdditionalFiles = true;
  readonly defaultDescriptionParser = PlaintextParser.parse;
  readonly acceptsFiles = [
    'png',
    'jpeg',
    'jpg',
    'gif',
    'swf',
    'flv',
    'mp4',
    'doc',
    'rtf',
    'txt',
    'mp3',
  ];

  async checkLoginStatus(data: UserAccountEntity): Promise<LoginResponse> {
    const status: LoginResponse = { loggedIn: false, username: null };
    const accountData: MissKeyAccountData = data.data;
    if (accountData && accountData.tokenData) {
      await this.getAndStoreInstanceInfo(data._id, accountData);

      status.loggedIn = true;
      status.username = accountData.username;
    }
    return status;
  }

  private async getAndStoreInstanceInfo(profileId: string, data: MissKeyAccountData) {
    const client = generator('misskey', `https://${data.website}`, data.tokenData.access_token);
    const instance = await client.getInstance();

    this.storeAccountInformation(profileId, INFO_KEY, instance.data);
  }

  getScalingOptions(file: FileRecord, accountId: string): ScalingOptions {
    const instanceInfo: MissKeyInstanceInfo = this.getAccountInfo(accountId, INFO_KEY);
    return instanceInfo?.configuration?.media_attachments
      ? {
          maxHeight: 4000,
          maxWidth: 4000,
          maxSize:
            file.type === FileSubmissionType.IMAGE
              ? instanceInfo.configuration.media_attachments.image_size_limit
              : instanceInfo.configuration.media_attachments.video_size_limit,
        }
      : {
          maxHeight: 4000,
          maxWidth: 4000,
          maxSize: FileSize.MBtoBytes(300),
        };
  }

  async postFileSubmission(
    cancellationToken: CancellationToken,
    data: FilePostData<MissKeyFileOptions>,
    accountData: MissKeyAccountData,
  ): Promise<PostResponse> {
    const M = generator(
      'misskey',
      `https://${accountData.website}`,
      accountData.tokenData.access_token,
    );

    const files = [data.primary, ...data.additional];
    const uploadedMedias: string[] = [];
    for (const file of files) {
      this.checkCancelled(cancellationToken);
      const upload = await M.uploadMedia(file.file.value, { description: data.options.altText });
      if (upload.status > 300) {
        return Promise.reject(
          this.createPostResponse({ additionalInfo: upload.status, message: upload.statusText }),
        );
      }
      uploadedMedias.push(upload.data.id);
    }

    const instanceInfo: MissKeyInstanceInfo = this.getAccountInfo(data.part.accountId, INFO_KEY);
    const chunkCount = instanceInfo?.configuration?.statuses?.max_media_attachments ?? 4;
    const maxChars = instanceInfo?.configuration?.statuses?.max_characters ?? 500;

    const isSensitive = data.rating !== SubmissionRating.GENERAL;
    const chunks = _.chunk(uploadedMedias, chunkCount);
    let status = `${data.options.useTitle && data.title ? `${data.title}\n` : ''}${
      data.description
    }`.substring(0, maxChars);
    let lastId = '';
    let source = '';

    for (let i = 0; i < chunks.length; i++) {
      const statusOptions: any = {
        sensitive: isSensitive,
        visibility: data.options.visibility || 'public',
        media_ids: chunks[i],
      };

      if (i !== 0) {
        statusOptions.in_reply_to_id = lastId;
      }
      if (data.options.spoilerText) {
        statusOptions.spoiler_text = data.options.spoilerText;
      }

      status = this.appendTags(this.formatTags(data.tags), status, maxChars);

      this.checkCancelled(cancellationToken);
      try {
        const result = (await M.postStatus(status, statusOptions)) as Response<Entity.Status>;
        lastId = result.data.id;
        if (!source) source = (await M.getStatus(result.data.id)).data.url;
      } catch (error) {
        return Promise.reject(this.createPostResponse({ message: error.message }));
      }
    }

    this.checkCancelled(cancellationToken);

    return this.createPostResponse({ source });
  }

  async postNotificationSubmission(
    cancellationToken: CancellationToken,
    data: PostData<Submission, MissKeyNotificationOptions>,
    accountData: MissKeyAccountData,
  ): Promise<PostResponse> {
    const M = generator(
      'misskey',
      `https://${accountData.website}`,
      accountData.tokenData.access_token,
    );

    const instanceInfo: MissKeyInstanceInfo = this.getAccountInfo(data.part.accountId, INFO_KEY);
    const maxChars = instanceInfo?.configuration?.statuses?.max_characters ?? 500;

    const isSensitive = data.rating !== SubmissionRating.GENERAL;
    const statusOptions: any = {
      sensitive: isSensitive,
      visibility: data.options.visibility || 'public',
    };
    let status = `${data.options.useTitle && data.title ? `${data.title}\n` : ''}${
      data.description
    }`;
    if (data.options.spoilerText) {
      statusOptions.spoiler_text = data.options.spoilerText;
    }
    status = this.appendTags(this.formatTags(data.tags), status, maxChars);

    this.checkCancelled(cancellationToken);
    try {
      const result = (await M.postStatus(status, statusOptions)).data as Entity.Status;
      const source = (await M.getStatus(result.id)).data.url;
      return this.createPostResponse({ source });
    } catch (error) {
      return Promise.reject(this.createPostResponse({ message: error.message }));
    }
  }

  formatTags(tags: string[]) {
    return this.parseTags(
      tags
        .map(tag => tag.replace(/[^a-z0-9]/gi, ' '))
        .map(tag =>
          tag
            .split(' ')
            // .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
            .join(''),
        ),
      { spaceReplacer: '_' },
    ).map(tag => `#${tag}`);
  }

  validateFileSubmission(
    submission: FileSubmission,
    submissionPart: SubmissionPart<MissKeyFileOptions>,
    defaultPart: SubmissionPart<DefaultOptions>,
  ): ValidationParts {
    const problems: string[] = [];
    const warnings: string[] = [];
    const isAutoscaling: boolean = submissionPart.data.autoScale;

    const description = this.defaultDescriptionParser(
      FormContent.getDescription(defaultPart.data.description, submissionPart.data.description),
    );

    const instanceInfo: MissKeyInstanceInfo = this.getAccountInfo(
      submissionPart.accountId,
      INFO_KEY,
    );
    const maxChars = instanceInfo ? instanceInfo?.configuration?.statuses?.max_characters : 500;

    if (description.length > maxChars) {
      warnings.push(
        `Max description length allowed is ${maxChars} characters (for this MissKey client).`,
      );
    } else {
      this.validateAppendTags(
        warnings,
        this.formatTags(FormContent.getTags(defaultPart.data.tags, submissionPart.data.tags)),
        description,
        maxChars
      );
    }

    const files = [
      submission.primary,
      ...(submission.additional || []).filter(
        f => !f.ignoredAccounts!.includes(submissionPart.accountId),
      ),
    ];

    const maxImageSize = instanceInfo
      ? instanceInfo?.configuration?.media_attachments?.image_size_limit
      : FileSize.MBtoBytes(50);

    files.forEach(file => {
      const { type, size, name, mimetype } = file;
      if (!WebsiteValidator.supportsFileType(file, this.acceptsFiles)) {
        problems.push(`Does not support file format: (${name}) ${mimetype}.`);
      }

      if (maxImageSize < size) {
        if (
          isAutoscaling &&
          type === FileSubmissionType.IMAGE &&
          ImageManipulator.isMimeType(mimetype)
        ) {
          warnings.push(`${name} will be scaled down to ${FileSize.BytesToMB(maxImageSize)}MB`);
        } else {
          problems.push(`MissKey limits ${mimetype} to ${FileSize.BytesToMB(maxImageSize)}MB`);
        }
      }

      // Check the image dimensions are not over 4000 x 4000 - this is the MissKey server max
      if (
        isAutoscaling &&
        type === FileSubmissionType.IMAGE &&
        (file.height > 4000 || file.width > 4000)
      ) {
        warnings.push(
          `${name} will be scaled down to a maximum size of 4000x4000, while maintaining aspect ratio`,
        );
      }
    });

    if (
      (submissionPart.data.tags.value.length > 1 || defaultPart.data.tags.value.length > 1) &&
      submissionPart.data.visibility != 'public'
    ) {
      warnings.push(
        `This post won't be listed under any hashtag as it is not public. Only public posts can be searched by hashtag.`,
      );
    }

    return { problems, warnings };
  }

  validateNotificationSubmission(
    submission: Submission,
    submissionPart: SubmissionPart<MissKeyNotificationOptions>,
    defaultPart: SubmissionPart<DefaultOptions>,
  ): ValidationParts {
    const warnings = [];
    const description = this.defaultDescriptionParser(
      FormContent.getDescription(defaultPart.data.description, submissionPart.data.description),
    );

    const instanceInfo: MissKeyInstanceInfo = this.getAccountInfo(
      submissionPart.accountId,
      INFO_KEY,
    );
    const maxChars = instanceInfo ? instanceInfo?.configuration?.statuses?.max_characters : 500;
    if (description.length > maxChars) {
      warnings.push(
        `Max description length allowed is ${maxChars} characters (for this MissKey client).`,
      );
    } else {
      this.validateAppendTags(
        warnings,
        this.formatTags(FormContent.getTags(defaultPart.data.tags, submissionPart.data.tags)),
        description,
        maxChars
      );
    }

    return { problems: [], warnings };
  }
}
