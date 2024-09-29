import { DefaultOptions } from '../../submission/default-options.interface';

export interface CohostNotificationOptions extends DefaultOptions {
  spoilerText?: string;
  spoilerTextOverwrite?: boolean;
}
