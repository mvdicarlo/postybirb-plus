import {
  DefaultFileOptions,
  DefaultOptions,
} from '../../submission/submission-part/interfaces/default-options.interface';

export interface SubscribeStarFileOptions extends DefaultFileOptions {
  tier?: string;
}

export interface SubscribeStarNotificationOptions extends DefaultOptions {
  tier?: string;
}
