import { PillowfortFileOptions, PillowfortNotificationOptions } from 'postybirb-commons';
import {
  GenericDefaultFileOptions,
  GenericDefaultNotificationOptions,
} from '../generic/generic.defaults';

export const PillowfortDefaultFileOptions: PillowfortFileOptions = {
  ...GenericDefaultFileOptions,
  privacy: 'public',
  allowComments: true,
  allowReblogging: true,
};

export const PillowfortDefaultNotificationOptions: PillowfortNotificationOptions = {
  ...GenericDefaultNotificationOptions,
  privacy: 'public',
  allowComments: true,
  allowReblogging: true,
};
