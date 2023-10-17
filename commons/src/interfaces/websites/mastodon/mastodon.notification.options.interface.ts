import { DefaultOptions } from '../../submission/default-options.interface';

export interface MastodonNotificationOptions extends DefaultOptions {
  useTitle: boolean;
  spoilerText?: string;
  visibility: string;
  replyToUrl?: string;
}
