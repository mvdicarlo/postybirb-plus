import { DefaultOptions } from '../../submission/default-options.interface';

export interface BlueskyNotificationOptions extends DefaultOptions {
  label_rating: string;
  replyToUrl?: string;
  threadgate?: string;
}
