import { SubscribeStarFileOptions, SubscribeStarNotificationOptions } from 'postybirb-commons';
import {
  GenericDefaultFileOptions,
  GenericDefaultNotificationOptions,
} from '../generic/generic.defaults';

export const SubscribeStarDefaultFileOptions: SubscribeStarFileOptions = {
  ...GenericDefaultFileOptions,
  tier: 'free',
  useTitle: true,
};

export const SubscribeStarDefaultNotificationOptions: SubscribeStarNotificationOptions = {
  ...GenericDefaultNotificationOptions,
  tier: 'free',
  useTitle: true,
};
