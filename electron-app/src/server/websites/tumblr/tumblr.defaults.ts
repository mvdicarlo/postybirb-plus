import { TumblrFileOptions, TumblrNotificationOptions } from 'postybirb-commons';
import {
  GenericDefaultFileOptions,
  GenericDefaultNotificationOptions,
} from '../generic/generic.defaults';

export const TumblrDefaultFileOptions: TumblrFileOptions = {
  ...GenericDefaultFileOptions,
  blog: undefined,
  useTitle: true,
};

export const TumblrDefaultNotificationOptions: TumblrNotificationOptions = {
  ...GenericDefaultNotificationOptions,
  blog: undefined,
  useTitle: true,
};
