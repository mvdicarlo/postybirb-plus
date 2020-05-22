import {
  DefaultFileOptions,
  DefaultOptions,
} from '../../submission/submission-part/interfaces/default-options.interface';

export interface TumblrFileOptions extends DefaultFileOptions {
  blog?: string;
  useTitle: boolean;
}

export interface TumblrNotificationOptions extends DefaultOptions {
  blog?: string;
  useTitle: boolean;
}
