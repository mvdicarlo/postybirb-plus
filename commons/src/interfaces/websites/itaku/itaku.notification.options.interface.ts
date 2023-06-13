import { DefaultOptions } from '../../submission/default-options.interface';

export interface ItakuNotificationOptions extends DefaultOptions {
  folders: string[];
  visibility: string;
  spoilerText?: string;
}
