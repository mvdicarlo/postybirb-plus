import { DefaultOptions } from '../../submission/default-options.interface';

export interface PillowfortNotificationOptions extends DefaultOptions {
  privacy: string;
  allowComments: boolean;
  allowReblogging: boolean;
  useTitle: boolean;
}
