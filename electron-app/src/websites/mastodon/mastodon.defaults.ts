import { MastodonFileOptions, MastodonNotificationOptions } from './mastodon.interface';
import {
  GenericDefaultFileOptions,
  GenericDefaultNotificationOptions,
} from '../generic/generic.defaults';

export const MastodonDefaultFileOptions: MastodonFileOptions = {
  ...GenericDefaultFileOptions,
  useTitle: false,
  spoilerText: '',
  isSensitive: false,
};

export const MastodonDefaultNotificationOptions: MastodonNotificationOptions = {
  ...GenericDefaultNotificationOptions,
  useTitle: false,
  spoilerText: '',
  isSensitive: false,
};
