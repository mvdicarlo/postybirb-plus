import { Injectable } from '@nestjs/common';
import {
  FileRecord,
  FileSubmissionType,
} from 'postybirb-commons';
import { ScalingOptions } from '../interfaces/scaling-options.interface';
import FileSize from 'src/server/utils/filesize.util';
import _ from 'lodash';
import { Megalodon } from '../megalodon/megalodon.service';

const INFO_KEY = 'INSTANCE INFO';

type PixelfedInstanceInfo = {
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
export class Pixelfed extends Megalodon {

  readonly enableAdvertisement = false;
  readonly acceptsFiles = ['png', 'jpeg', 'jpg', 'gif', 'swf', 'flv', 'mp4'];

  readonly megalodonService = 'mastodon'; // At some point will change this when they get Pixelfed support natively

  getInstanceSettings(accountId: string) {
    const instanceInfo: PixelfedInstanceInfo = this.getAccountInfo(accountId, INFO_KEY);

    this.maxCharLength = instanceInfo?.configuration?.statuses?.max_characters ?? 500;
    this.maxMediaCount = instanceInfo ? instanceInfo?.configuration?.statuses?.max_media_attachments : 4;
  }

  getScalingOptions(file: FileRecord, accountId: string): ScalingOptions {
    const instanceInfo: PixelfedInstanceInfo = this.getAccountInfo(accountId, INFO_KEY);
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

  // https://{instance}/i/web/post/{id}
  getPostIdFromUrl(url: string): string | null {
    if (url && url.lastIndexOf('/') > -1) {
      return url.slice(url.lastIndexOf('/') + 1);
    } else { 
      return null;
    }
  }
}
