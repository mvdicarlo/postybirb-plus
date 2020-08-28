import {
  DefaultFileOptions,
  DefaultOptions,
} from '../../submission/submission-part/interfaces/default-options.interface';

export interface NewTumblFileOptions extends DefaultFileOptions {
  blog: string;
}

export interface NewTumblNotificationOptions extends DefaultOptions {
  blog: string;
}
