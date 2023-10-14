import { DefaultOptions } from '../../submission/default-options.interface';

export interface PleromaNotificationOptions extends DefaultOptions {
  useTitle: boolean;
  spoilerText?: string;
  visibility: string;
  replyToUrl?: string;
}
