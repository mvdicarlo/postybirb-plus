import {
  DefaultFileOptions,
  DefaultOptions,
} from '../submission/default-options.interface';

export interface PillowfortFileOptions extends DefaultFileOptions {
  privacy: string;
  allowComments: boolean;
  allowReblogging: boolean;
}

export interface PillowfortNotificationOptions extends DefaultOptions {
  privacy: string;
  allowComments: boolean;
  allowReblogging: boolean;
}
