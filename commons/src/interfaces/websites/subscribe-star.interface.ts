import {
  DefaultFileOptions,
  DefaultOptions,
} from '../submission/default-options.interface';

export interface SubscribeStarFileOptions extends DefaultFileOptions {
  tier?: string;
  useTitle: boolean;
}

export interface SubscribeStarNotificationOptions extends DefaultOptions {
  tier?: string;
  useTitle: boolean;
}
