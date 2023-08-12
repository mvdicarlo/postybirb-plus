import { Injectable } from '@nestjs/common';
import generator, { Entity, Response } from 'megalodon'
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
import Http from 'src/server/http/http.util';
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
import WaitUtil from 'src/server/utils/wait.util';
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
      const refresh = await this.refreshToken(accountData);
      if (refresh) {
        status.loggedIn = true;
        status.username = accountData.username;
        this.getInstanceInfo(data._id, accountData);
      }
    }
    return status;
  }

  private async getInstanceInfo(profileId: string, data: MissKeyAccountData) {   
    const client = generator('misskey', `https://${data.website}`, data.tokenData.access_token);
    const instance = await client.getInstance();
   
    this.storeAccountInformation(profileId, INFO_KEY, instance.data);
  }

  // TBH not entirely sure why this is a thing, but its in the old code so... :shrug:
  private async refreshToken(data: MissKeyAccountData): Promise<boolean> {
    const M = this.getMissKeyInstance(data);
    return true;
  }

  private getMissKeyInstance(data: MissKeyAccountData) : Entity.Instance {
    const client = generator('misskey', `https://${data.website}`, data.tokenData.access_token);
    client.getInstance().then((res) => {
      return res.data;
    });
    return null;
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
          maxSize: FileSize.MBtoBytes(300) 
      };
  }

  private async uploadMedia(
    data: MissKeyAccountData,
    file: PostFile,
    altText: string,
  ): Promise<{ id: string }> {

    const M = generator('misskey', `https://${data.website}`, data.tokenData.access_token);
    const upload = await M.uploadMedia(file.value, { description: altText });
    console.log(upload)
    if (upload.status > 300) {
      return Promise.reject(
        this.createPostResponse({ additionalInfo: upload.status, message: upload.statusText }),
      );
    }

    return { id: upload.data.id };
  }

  async postFileSubmission(
    cancellationToken: CancellationToken,
    data: FilePostData<MissKeyFileOptions>,
    accountData: MissKeyAccountData,
  ): Promise<PostResponse> {
    const M = generator('misskey', `https://${accountData.website}`, accountData.tokenData.access_token);

    const files = [data.primary, ...data.additional];
    this.checkCancelled(cancellationToken);
    const uploadedMedias: {
      id: string;
    }[] = [];
    for (const file of files) {
      uploadedMedias.push(await this.uploadMedia(accountData, file.file, data.options.altText));
    }

    const instanceInfo: MissKeyInstanceInfo = this.getAccountInfo(data.part.accountId, INFO_KEY);
    const chunkCount = instanceInfo ? instanceInfo?.configuration?.statuses?.max_media_attachments : 4;
    const maxChars = instanceInfo ? instanceInfo?.configuration?.statuses?.max_characters : 500;

    const isSensitive = data.rating !== SubmissionRating.GENERAL;
    const { options } = data;
    const chunks = _.chunk(uploadedMedias, chunkCount);
    let lastId = undefined;

    for (let i = 0; i < chunks.length; i++) {
      let statusOptions: any = {
        status: '',
        sensitive: isSensitive,
        visibility: options.visibility || 'public',
        spoiler_text: ''
      };
      let status = undefined;

      let form = undefined;
      if (i === 0) {
        status = `${options.useTitle && data.title ? `${data.title}\n` : ''}${
          data.description
        }`.substring(0, maxChars)

        statusOptions = {
          sensitive: isSensitive,
          visibility: options.visibility || 'public',
          media_ids: chunks[i].map((media) => media.id), 
          spoiler_text: "",
        }
     } else {
      statusOptions = {
        sensitive: isSensitive,
        visibility: options.visibility || 'public',
        media_ids: chunks[i].map((media) => media.id),
        in_reply_to_id: lastId,  
        spoiler_text: "",    
      }      
     }

      const tags = this.formatTags(data.tags);

      // Update the post content with the Tags if any are specified - for MissKey, we need to append 
      // these onto the post, *IF* there is character count available.
      if (tags.length > 0) {
        status += "\n\n";
      }

      tags.forEach(tag => {
        let remain = maxChars - form.status.length;
        let tagToInsert = tag;
        if (remain > (tagToInsert.length)) {
          status += ` ${tagToInsert}`
        }
        // We don't exit the loop, so we can cram in every possible tag, even if there are short ones!
      })
      
      if (options.spoilerText) {
        statusOptions.spoiler_text = options.spoilerText;
      }

      this.checkCancelled(cancellationToken);

      await M.postStatus(status, statusOptions).then((result) => {
        lastId = result.data.id;
        let res = result.data as Entity.Status;
        return this.createPostResponse({ source: res.url });
      }).catch((err: Error) => {
        return Promise.reject(
          this.createPostResponse({ message: err.message }),
        );
      })
    }

    return this.createPostResponse({});
  }

  async postNotificationSubmission(
    cancellationToken: CancellationToken,
    data: PostData<Submission, MissKeyNotificationOptions>,
    accountData: MissKeyAccountData,
  ): Promise<PostResponse> {
    const mInstance = this.getMissKeyInstance(accountData);
    const M = generator('misskey', `https://${accountData.website}`, accountData.tokenData.access_token);
    
    const maxChars = mInstance ? mInstance?.configuration?.statuses?.max_characters : 500;

    const isSensitive = data.rating !== SubmissionRating.GENERAL;

    const { options } = data;
    let status = `${options.useTitle && data.title ? `${data.title}\n` : ''}${data.description}`;
    const statusOptions: any = {
      sensitive: isSensitive,
      visibility: options.visibility || 'public',
      spoiler_text: ""
    };

    const tags = this.formatTags(data.tags);

    // Update the post content with the Tags if any are specified - for MissKey, we need to append 
    // these onto the post, *IF* there is character count available.
    if (tags.length > 0) {
      status += "\n\n";
    }

    tags.forEach(tag => {
      let remain = maxChars - status.length;
      let tagToInsert = tag;
      if (remain > (tagToInsert.length)) {
        status += ` ${tagToInsert}`
      }
      // We don't exit the loop, so we can cram in every possible tag, even if there are short ones!
    })

    if (options.spoilerText) {
      statusOptions.spoiler_text = options.spoilerText;
    }

    this.checkCancelled(cancellationToken);

    await M.postStatus(status, statusOptions).then((result) => {
      let res = result.data as Entity.Status;
      return this.createPostResponse({ source: res.url });
    }).catch((err: Error) => {
      return Promise.reject(
        this.createPostResponse({ message: err.message }),
      );
    })
    return this.createPostResponse({});
  }

  formatTags(tags: string[]) {
    return this.parseTags(
      tags
        .map((tag) => tag.replace(/[^a-z0-9]/gi, ' '))
        .map((tag) =>
          tag
            .split(' ')
            // .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
            .join(''),
        ),
      { spaceReplacer: '_' },
    ).map((tag) => `#${tag}`);
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
    }

    const files = [
      submission.primary,
      ...(submission.additional || []).filter(
        (f) => !f.ignoredAccounts!.includes(submissionPart.accountId),
      ),
    ];

    const maxImageSize = instanceInfo
      ? instanceInfo?.configuration?.media_attachments?.image_size_limit
      : FileSize.MBtoBytes(50);

    files.forEach((file) => {
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
        (file.height > 4000 || file.width > 4000)) {
          warnings.push(`${name} will be scaled down to a maximum size of 4000x4000, while maintaining
           aspect ratio`);
        }
    });

    if ((submissionPart.data.tags.value.length > 1 || defaultPart.data.tags.value.length > 1) && 
      submissionPart.data.visibility != "public") {
        warnings.push(
              `This post won't be listed under any hashtag as it is not public. Only public posts 
              can be searched by hashtag.`,
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
    }

    return { problems: [], warnings };
  }
}
