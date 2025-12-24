import { Injectable } from '@nestjs/common';
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
import path from 'path';

const INFO_KEY = 'INSTANCE INFO';

type MissKeyInstanceInfo = {
  maxNoteTextLength: number;
  driveCapacityPerLocalUserMb: number;
};

// Dynamic import cache for ES module
let misskeyModule: typeof import('misskey-js') | null = null;
async function getMisskeyModule() {
  if (!misskeyModule) {
    // Determine the correct path for asar/unpacked
    let modulePath = 'misskey-js';
    if (process.mainModule?.filename.includes('app.asar')) {
      // Running from asar, so use the unpacked path
      const base = process.resourcesPath;
      modulePath = path.join(
        'file://',
        base,
        'app.asar.unpacked',
        'node_modules',
        'misskey-js',
        'built',
        'index.js'
      );
    }
    const dynamicImport = new Function('specifier', 'return import(specifier)');
    misskeyModule = await dynamicImport(modulePath);
  }
  return misskeyModule;
}

@Injectable()
export class MissKey extends Website {
  constructor(private readonly fileRepository: FileManagerService) {
    super();
  }
  readonly BASE_URL: string;
  readonly enableAdvertisement = false;
  readonly acceptsAdditionalFiles = true;
  MAX_CHARS: number = -1; // No Limit
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
    if (accountData && accountData.token) {
      await this.getAndStoreInstanceInfo(data._id, accountData);

      status.loggedIn = true;
      status.username = accountData.username;
    }
    return status;
  }

  private async getAndStoreInstanceInfo(profileId: string, data: MissKeyAccountData) {
    const Misskey = await getMisskeyModule();
    const cli = new Misskey.api.APIClient({
      origin: `https://${data.website}`,
      credential: data.token,
    });
    
    const meta = await cli.request('meta', {});
    this.storeAccountInformation(profileId, INFO_KEY, meta);
  }

  getScalingOptions(file: FileRecord, accountId: string): ScalingOptions {
    const instanceInfo: MissKeyInstanceInfo = this.getAccountInfo(accountId, INFO_KEY);
    // Misskey typically limits files based on the drive capacity
    // Default to conservative limits if instance info not available
    return {
      maxHeight: 4000,
      maxWidth: 4000,
      maxSize: FileSize.MBtoBytes(instanceInfo?.driveCapacityPerLocalUserMb ? 50 : 10),
    };
  }

  async postFileSubmission(
    cancellationToken: CancellationToken,
    data: FilePostData<MissKeyFileOptions>,
    accountData: MissKeyAccountData,
  ): Promise<PostResponse> {
    const Misskey = await getMisskeyModule();
    const cli = new Misskey.api.APIClient({
      origin: `https://${accountData.website}`,
      credential: accountData.token,
    });

    const files = [data.primary, ...data.additional];
    const uploadedFileIds: string[] = [];
    
    for (const file of files) {
      this.checkCancelled(cancellationToken);
      
      // Create a Blob from the Buffer for misskey-js
      // Note: In Node.js we need to use the file buffer directly via multipart/form-data
      const FormData = require('form-data');
      const form = new FormData();
      form.append('file', file.file.value, {
        filename: file.file.options.filename,
        contentType: file.file.options.contentType,
      });
      
      if (file.altText || data.options.altText) {
        form.append('comment', file.altText || data.options.altText);
      }
      form.append('isSensitive', data.rating !== SubmissionRating.GENERAL ? 'true' : 'false');
      
      // Make direct HTTP request to drive/files/create endpoint
      const axios = require('axios');
      const uploadResponse = await axios.post(
        `https://${accountData.website}/api/drive/files/create`,
        form,
        {
          headers: {
            ...form.getHeaders(),
            'Authorization': `Bearer ${accountData.token}`,
          },
        }
      );
      
      uploadedFileIds.push(uploadResponse.data.id);
    }

    const instanceInfo: MissKeyInstanceInfo = this.getAccountInfo(data.part.accountId, INFO_KEY);
    const maxChars = instanceInfo?.maxNoteTextLength ?? 3000;

    const isSensitive = data.rating !== SubmissionRating.GENERAL;
    const chunks = _.chunk(uploadedFileIds, 4); // Misskey typically allows 4 files per note
    
    let noteText = `${data.options.useTitle && data.title ? `${data.title}\n` : ''}${data.description}`.substring(0, maxChars);
    let lastNoteId: string | undefined;
    let source = '';

    for (let i = 0; i < chunks.length; i++) {
      this.checkCancelled(cancellationToken);
      
      const noteParams: import('misskey-js').entities.NotesCreateRequest = {
        text: noteText,
        fileIds: chunks[i],
        visibility: data.options.visibility as any || 'public',
        cw: data.spoilerText || data.options.spoilerText || undefined,
      };

      if (i !== 0 && lastNoteId) {
        noteParams.replyId = lastNoteId;
      }

      try {
        const result = await cli.request('notes/create', noteParams);
        lastNoteId = result.createdNote.id;
        
        if (!source) {
          // Construct the note URL
          source = `https://${accountData.website}/notes/${result.createdNote.id}`;
        }
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
    const Misskey = await getMisskeyModule();
    const cli = new Misskey.api.APIClient({
      origin: `https://${accountData.website}`,
      credential: accountData.token,
    });

    const instanceInfo: MissKeyInstanceInfo = this.getAccountInfo(data.part.accountId, INFO_KEY);
    const maxChars = instanceInfo?.maxNoteTextLength ?? 3000;

    const isSensitive = data.rating !== SubmissionRating.GENERAL;
    let noteText = `${data.options.useTitle && data.title ? `${data.title}\n` : ''}${data.description}`.substring(0, maxChars);
    
    const noteParams: import('misskey-js').entities.NotesCreateRequest = {
      text: noteText,
      visibility: data.options.visibility as any || 'public',
      cw: data.spoilerText || data.options.spoilerText || undefined,
    };

    this.checkCancelled(cancellationToken);
    try {
      const result = await cli.request('notes/create', noteParams);
      const source = `https://${accountData.website}/notes/${result.createdNote.id}`;
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

    const instanceInfo: MissKeyInstanceInfo = this.getAccountInfo(submissionPart.accountId, INFO_KEY);
    const maxChars = instanceInfo?.maxNoteTextLength ?? 3000;

    if (description.length > maxChars) {
      warnings.push(
        `Max description length allowed is ${maxChars} characters (for this MissKey instance).`,
      );
    } else {
      this.validateInsertTags(
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

    // Default to 50MB if instance info not available
    const maxImageSize = FileSize.MBtoBytes(50);

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

      // Check the image dimensions are not over 4000 x 4000 - conservative limit for Misskey
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

    const instanceInfo: MissKeyInstanceInfo = this.getAccountInfo(submissionPart.accountId, INFO_KEY);
    const maxChars = instanceInfo?.maxNoteTextLength ?? 3000;
    
    if (description.length > maxChars) {
      warnings.push(
        `Max description length allowed is ${maxChars} characters (for this MissKey instance).`,
      );
    } else {
      this.validateInsertTags(
        warnings,
        this.formatTags(FormContent.getTags(defaultPart.data.tags, submissionPart.data.tags)),
        description,
        maxChars
      );
    }

    return { problems: [], warnings };
  }
}
