import generator, { Entity } from 'megalodon';
import {
  DefaultOptions,
  FileRecord,
  FileSubmission,
  FileSubmissionType,
  MegalodonAccountData,
  MastodonFileOptions,
  MastodonNotificationOptions,
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
import {
  FilePostData,
  PostFile,
} from 'src/server/submission/post/interfaces/file-post-data.interface';
import { PostData } from 'src/server/submission/post/interfaces/post-data.interface';
import { ValidationParts } from 'src/server/submission/validator/interfaces/validation-parts.interface';
import FileSize from 'src/server/utils/filesize.util';
import FormContent from 'src/server/utils/form-content.util';
import WebsiteValidator from 'src/server/utils/website-validator.util';
import { LoginResponse } from '../interfaces/login-response.interface';
import { Website } from '../website.base';
import _ from 'lodash';
import { FileManagerService } from 'src/server/file-manager/file-manager.service';
import * as fs from 'fs';
import { tmpdir } from 'os';
import * as path from 'path';

const INFO_KEY = 'INSTANCE INFO';

export abstract class Megalodon extends Website {
  constructor(private readonly fileRepository: FileManagerService) {
    super();
  }

  megalodonService: 'mastodon' | 'pleroma' | 'misskey' | 'friendica' = 'mastodon'; // Set this as appropriate in your constructor
  maxMediaCount = 4; 

  readonly BASE_URL: string;
  MAX_CHARS: number = 500;
  readonly enableAdvertisement = false;
  readonly acceptsAdditionalFiles = true;
  readonly defaultDescriptionParser = PlaintextParser.parse;
  readonly acceptsFiles = [ // Override, or extend this list in your inherited classes! 
    'png',
    'jpeg',
    'jpg',
    'gif',
    'webp',
    'm4v',
    'mov'
  ];

  // Boiler plate login check code across all versions of services using the megalodon library
  async checkLoginStatus(data: UserAccountEntity): Promise<LoginResponse> {
    const status: LoginResponse = { loggedIn: false, username: null };
    const accountData: MegalodonAccountData = data.data;
    this.logger.debug(`Login check: ${data._id} = ${accountData.website}`);
    if (accountData && accountData.token) {
      await this.getAndStoreInstanceInfo(data._id, accountData);

      status.loggedIn = true;
      status.username = accountData.username;
    }
    return status;
  }

  private async getAndStoreInstanceInfo(profileId: string, data: MegalodonAccountData) {
    const client = generator(this.megalodonService, data.website, data.token);
    const instance = await client.getInstance();
    this.logger.debug("*************");
    this.logger.debug(`Account ID ${profileId}`);
    this.logger.debug(instance.data);
    this.logger.debug("*************");
    this.storeAccountInformation(profileId, INFO_KEY, instance.data);
  }

  abstract getScalingOptions(file: FileRecord, accountId: string): ScalingOptions;

  abstract getInstanceSettings(accountId: string);

  async postFileSubmission(
    cancellationToken: CancellationToken,
    data: FilePostData<MastodonFileOptions>,
    accountData: MegalodonAccountData,
  ): Promise<PostResponse> {
    this.logger.log("Posting a file")
    this.getInstanceSettings(data.part.accountId);

    const M = generator(this.megalodonService, accountData.website, accountData.token);

    const files = [data.primary, ...data.additional];
    const uploadedMedias: string[] = [];
    for (const file of files) {
      this.checkCancelled(cancellationToken);
      uploadedMedias.push(await this.uploadMedia(accountData, file.file, data.options.altText));
    }

    const isSensitive = data.rating !== SubmissionRating.GENERAL;
    const chunks = _.chunk(uploadedMedias, this.maxMediaCount);
    let status = `${data.options.useTitle && data.title ? `${data.title}\n` : ''}${
      data.description
    }`.substring(0, this.MAX_CHARS);
    let lastId = '';
    let source = '';
    const replyToId = this.getPostIdFromUrl(data.options.replyToUrl);

    for (let i = 0; i < chunks.length; i++) {
      this.checkCancelled(cancellationToken);
      const statusOptions: any = {
        sensitive: isSensitive,
        visibility: data.options.visibility || 'public',
        media_ids: chunks[i],
      };

      if (i !== 0) {
        statusOptions.in_reply_to_id = lastId;
      } else if (replyToId) {
        statusOptions.in_reply_to_id = replyToId;
      }

      if (data.options.spoilerText) {
        statusOptions.spoiler_text = data.options.spoilerText;
      }

      try {
        const result = (await M.postStatus(status, statusOptions)).data as Entity.Status;
        if (!source) source = result.url;
        lastId = result.id;
      } catch (err) {
        return Promise.reject(
          this.createPostResponse({
            message: err.message,
            stack: err.stack,
            additionalInfo: { chunkNumber: i },
          }),
        );
      }
    }

    this.checkCancelled(cancellationToken);

    return this.createPostResponse({ source });
  }

  async postNotificationSubmission(
    cancellationToken: CancellationToken,
    data: PostData<Submission, MastodonNotificationOptions>,
    accountData: MegalodonAccountData,
  ): Promise<PostResponse> {
    this.logger.log("Posting a notification")
    this.getInstanceSettings(data.part.accountId);

    const M = generator(this.megalodonService, accountData.website, accountData.token);

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

    const replyToId = this.getPostIdFromUrl(data.options.replyToUrl);
    if (replyToId) {
      statusOptions.in_reply_to_id = replyToId;
    }

    this.checkCancelled(cancellationToken);
    try {
      const result = (await M.postStatus(status, statusOptions)).data as Entity.Status;
      return this.createPostResponse({ source: result.url });
    } catch (error) {
      return Promise.reject(this.createPostResponse(error));
    }
  }

  formatTags(tags: string[]) {
    return this.parseTags(
      tags.map(tag => tag.replace(/[^a-z0-9]/gi, ' ')).map(tag => tag.split(' ').join('')),
      { spaceReplacer: '_' },
    ).map(tag => `#${tag}`);
  }

  validateFileSubmission(
    submission: FileSubmission,
    submissionPart: SubmissionPart<MastodonFileOptions>,
    defaultPart: SubmissionPart<DefaultOptions>,
  ): ValidationParts {
    this.getInstanceSettings(submissionPart.accountId);

    const problems: string[] = [];
    const warnings: string[] = [];
    const isAutoscaling: boolean = submissionPart.data.autoScale;

    const description = this.defaultDescriptionParser(
      FormContent.getDescription(defaultPart.data.description, submissionPart.data.description),
    );

    if (description.length > this.MAX_CHARS) {
      warnings.push(
        `Max description length allowed is ${this.MAX_CHARS} characters.`,
      );
    } else {
      this.validateInsertTags(
        warnings,
        this.formatTags(FormContent.getTags(defaultPart.data.tags, submissionPart.data.tags)),
        description,
        this.MAX_CHARS,
      );
    }

    const files = [
      submission.primary,
      ...(submission.additional || []).filter(
        f => !f.ignoredAccounts!.includes(submissionPart.accountId),
      ),
    ];

    files.forEach(file => {
      const { type, size, name, mimetype } = file;
      if (!WebsiteValidator.supportsFileType(file, this.acceptsFiles)) {
        problems.push(`Does not support file format: (${name}) ${mimetype}.`);
      }

      const scalingOptions = this.getScalingOptions(file, submissionPart.accountId);

      if (scalingOptions && scalingOptions.maxSize < size) {
        if (
          isAutoscaling &&
          type === FileSubmissionType.IMAGE &&
          ImageManipulator.isMimeType(mimetype)
        ) {
          warnings.push(
            `${name} will be scaled down to ${FileSize.BytesToMB(scalingOptions.maxSize)}MB`,
          );
        } else {
          problems.push(
            `This instance limits ${mimetype} to ${FileSize.BytesToMB(scalingOptions.maxSize)}MB`,
          );
        }
      }

      if (
        scalingOptions &&
        isAutoscaling &&
        type === FileSubmissionType.IMAGE &&
        scalingOptions.maxWidth &&
        scalingOptions.maxHeight &&
        (file.height > scalingOptions.maxHeight || file.width > scalingOptions.maxWidth)
      ) {
        warnings.push(
          `${name} will be scaled down to a maximum size of ${scalingOptions.maxWidth}x${scalingOptions.maxHeight}, while maintaining aspect ratio`,
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

    this.validateReplyToUrl(problems, submissionPart.data.replyToUrl);

    return { problems, warnings };
  }

  validateNotificationSubmission(
    submission: Submission,
    submissionPart: SubmissionPart<MastodonNotificationOptions>,
    defaultPart: SubmissionPart<DefaultOptions>,
  ): ValidationParts {
    this.getInstanceSettings(submissionPart.accountId);

    const problems = [];
    const warnings = [];

    const description = this.defaultDescriptionParser(
      FormContent.getDescription(defaultPart.data.description, submissionPart.data.description),
    );

    if (description.length > this.MAX_CHARS) {
      warnings.push(
        `Max description length allowed is ${this.MAX_CHARS} characters.`,
      );
    } else {
      this.validateInsertTags(
        warnings,
        this.formatTags(FormContent.getTags(defaultPart.data.tags, submissionPart.data.tags)),
        description,
        this.MAX_CHARS,
      );
    }

    this.validateReplyToUrl(problems, submissionPart.data.replyToUrl);

    return { problems, warnings };
  }

  validateReplyToUrl(problems: string[], url?: string): void {
    if(url?.trim() && !this.getPostIdFromUrl(url)) {
      problems.push("Invalid post URL to reply to.");
    }
  }

  abstract getPostIdFromUrl(url: string): string | null;

  async uploadMedia(
    data: MegalodonAccountData,
    file: PostFile,
    altText: string,
  ): Promise<string> {
    this.logger.log("Uploading media")
    const M = generator(this.megalodonService, data.website, data.token);

    // megalodon is odd, and doesnt seem to like the buffer being passed to the upload media call
    // So lets write the file out to a temp file, then pass that to createReadStream, then that to uploadMedia.
    // That works .... \o/
    const tempDir = tmpdir();

    fs.writeFileSync(path.join(tempDir, file.options.filename), file.value);

    const upload = await M.uploadMedia(fs.createReadStream(path.join(tempDir, file.options.filename)), { description: altText });
    fs.unlink(path.join(tempDir, file.options.filename), (err) => { 
      if (err) {
        this.logger.error("Unable to remove the temp file", err.stack, err.message);
      }
    });

    if (upload.status > 300) {
      this.logger.log(upload);
      return Promise.reject(
        this.createPostResponse({ additionalInfo: upload.status, message: upload.statusText }),
      );
    }

    this.logger.log("Image uploaded");

    return upload.data.id;
  }

}
