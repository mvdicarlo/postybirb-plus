import { DefaultOptions } from '../../submission/default-options.interface';

export interface MissKeyNotificationOptions extends DefaultOptions {
  useTitle: boolean;
  spoilerText?: string;
  visibility: string;
}
