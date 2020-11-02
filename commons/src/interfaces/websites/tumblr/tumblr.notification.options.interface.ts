import { DefaultOptions } from '../../submission/default-options.interface';

export interface TumblrNotificationOptions extends DefaultOptions {
  blog?: string;
  useTitle: boolean;
}
