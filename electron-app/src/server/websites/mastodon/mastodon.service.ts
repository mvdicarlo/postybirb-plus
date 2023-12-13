import { Injectable } from '@nestjs/common';
import {
  FileRecord,
  FileSubmissionType,
  MegalodonInstanceSettings,
} from 'postybirb-commons';
import { ScalingOptions } from '../interfaces/scaling-options.interface';
import _ from 'lodash';
import { Megalodon } from '../megalodon/megalodon.service';
import {  } from 'postybirb-commons';

const INFO_KEY = 'INSTANCE INFO';

type MastodonInstanceInfo = {
  configuration: {
    statuses?: {
      max_characters: number;
      max_media_attachments: number;
    };
    media_attachments?: {
      supported_mime_types: string[];
      image_size_limit: number;
      video_size_limit: number;
      image_matrix_limit: number;
      video_matrix_limit: number;
    };
  };
}

@Injectable()
export class Mastodon extends Megalodon {

  readonly megalodonService = 'mastodon';

  readonly acceptsFiles = [
    'png',
    'jpeg',
    'jpg',
    'gif',
    'webp',
    'avif',
    'heic',
    'heif',
    'mp4',
    'webm',
    'm4v',
    'mov',
    'doc',
    'rtf',
    'txt',
    'mp3',
    'wav',
    'ogg',
    'oga',
    'opus',
    'aac',
    'm4a',
    '3gp',
    'wma',
  ];

  getInstanceSettings(accountId: string) {
    const instanceInfo: MastodonInstanceInfo = this.getAccountInfo(accountId, INFO_KEY);

    let result = new MegalodonInstanceSettings();
    result.maxChars = instanceInfo?.configuration?.statuses?.max_characters ?? 500;
    result.maxImages = instanceInfo ? instanceInfo?.configuration?.statuses?.max_media_attachments : 4;

    return result;
  }

  getScalingOptions(file: FileRecord, accountId: string): ScalingOptions {
    const instanceInfo: MastodonInstanceInfo = this.getAccountInfo(accountId, INFO_KEY);
    if (instanceInfo?.configuration?.media_attachments) {
      const maxPixels =
        file.type === FileSubmissionType.IMAGE
          ? instanceInfo.configuration.media_attachments.image_matrix_limit
          : instanceInfo.configuration.media_attachments.video_matrix_limit;

      return {
        maxHeight: Math.round(Math.sqrt(maxPixels * (file.width / file.height))),
        maxWidth: Math.round(Math.sqrt(maxPixels * (file.height / file.width))),
        maxSize:
          file.type === FileSubmissionType.IMAGE
            ? instanceInfo.configuration.media_attachments.image_size_limit
            : instanceInfo.configuration.media_attachments.video_size_limit,
      };
    } else {
      return undefined;
    }
  }

  getPostIdFromUrl(url: string): string | null {
    // We expect this to a post URL like https://{instance}/@{user}/{id} or
    // https://:instance/deck/@{user}/{id}. We grab the id after the @ part.
    const match = /\/@[^\/]+\/([0-9]+)/.exec(url);
    return match ? match[1] : null;
  }
}
