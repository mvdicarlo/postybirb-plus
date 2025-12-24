import { Injectable } from '@nestjs/common';
import {
  FileRecord,
  FileSubmissionType,
  MegalodonInstanceSettings,
} from 'postybirb-commons';
import { ScalingOptions } from '../interfaces/scaling-options.interface';
import FileSize from 'src/server/utils/filesize.util';
import _ from 'lodash';
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
  megalodonService: 'mastodon' | 'pleroma' | 'friendica' | 'firefish' | 'gotosocial' = 'pleroma';
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

    let result = new MegalodonInstanceSettings();
    // Setting the default number to a high value; older Pleroma and all Akkoma instances don't limit.
    result.maxChars = instanceInfo?.max_toot_chars ?? 500;
    result.maxImages = instanceInfo?.max_media_attachments ?? 20; 

    return result;
  }

  getScalingOptions(file: FileRecord, accountId: string): ScalingOptions {
    const instanceInfo: PleromaInstanceInfo = this.getAccountInfo(accountId, INFO_KEY);
    return instanceInfo?.configuration?.media_attachments
      ? {
          maxSize: instanceInfo.upload_limit,
        }
      : {           
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
