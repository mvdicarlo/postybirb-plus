import { Injectable } from '@nestjs/common';
import generator, { Entity, Response } from 'megalodon'
import {
  DefaultOptions,
  FileRecord,
  FileSubmission,
  FileSubmissionType,
  MegalodonAccountData,
  PleromaFileOptions,
  PleromaNotificationOptions,
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
import { Readable } from 'stream';
import * as fs from 'fs';
import { tmpdir } from 'os';
import * as path from 'path';
import { Megalodon } from '../megalodon/megalodon.service';

const INFO_KEY = 'INSTANCE INFO';

type PleromaInstanceInfo = {
  upload_limit?: number; // Pleroma, Akkoma
  max_toot_chars?: number; // Pleroma, Akkoma
  max_media_attachments?: number; //Pleroma
  configuration: {
    media_attachments: {
      image_size_limit: number;
      video_size_limit: number;
    };  
  }
};

@Injectable()
export class Pleroma extends Megalodon {

  readonly acceptsAdditionalFiles = true;
  megalodonService: 'mastodon' | 'pleroma' | 'misskey' | 'friendica' = 'pleroma';
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

  getInstanceSettings(accountId: string) {
    const instanceInfo: PleromaInstanceInfo = this.getAccountInfo(accountId, INFO_KEY);

    this.maxCharLength = instanceInfo?.max_toot_chars ?? 500;
    this.maxMediaCount = instanceInfo?.max_media_attachments ?? 4;
  }

  getScalingOptions(file: FileRecord, accountId: string): ScalingOptions {
    const instanceInfo: PleromaInstanceInfo = this.getAccountInfo(accountId, INFO_KEY);
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
          maxSize: FileSize.MBtoBytes(16) 
      };
  }

  getPostIdFromUrl(url: string): string | null {
    if (url) {
      const match = url.slice(url.lastIndexOf('/')+1)
      return match ? match[1] : null;
    } else {
      return null;
    }
  }
}
