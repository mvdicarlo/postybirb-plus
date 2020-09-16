import { FurryNetworkFileOptions, FurryNetworkNotificationOptions } from 'postybirb-commons';
import {
  GenericDefaultFileOptions,
  GenericDefaultNotificationOptions,
} from '../generic/generic.defaults';

export const FurryNetworkDefaultFileOptions: FurryNetworkFileOptions = {
  ...GenericDefaultFileOptions,
  profile: undefined,
  folders: [],
  communityTags: true,
};

export const FurryNetworkDefaultNotificationOptions: FurryNetworkNotificationOptions = {
  ...GenericDefaultNotificationOptions,
  profile: undefined,
  communityTags: true,
  folders: [],
};
