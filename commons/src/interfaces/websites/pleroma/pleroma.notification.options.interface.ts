import { DefaultOptions } from '../../submission/default-options.interface';

export interface PleromaNotificationOptions extends DefaultOptions {
  useTitle: boolean;
  spoilerText?: string;
  spoilerTextOverwrite?: boolean;
  visibility: string;
  replyToUrl?: string;
}
