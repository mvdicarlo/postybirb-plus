import {
  FurryNetworkFileOptions,
  FurryNetworkNotificationOptions,
} from './furry-network.interface';
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
