import { NewTumblFileOptions, NewTumblNotificationOptions } from 'postybirb-commons';
import {
  GenericDefaultFileOptions,
  GenericDefaultNotificationOptions,
} from '../generic/generic.defaults';

export const NewTumblDefaultFileOptions: NewTumblFileOptions = {
  ...GenericDefaultFileOptions,
  blog: '',
};

export const NewTumblDefaultNotificationOptions: NewTumblNotificationOptions = {
  ...GenericDefaultNotificationOptions,
  blog: '',
};
