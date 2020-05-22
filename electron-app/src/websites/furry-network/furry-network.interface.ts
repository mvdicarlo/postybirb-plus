import {
  DefaultFileOptions,
  DefaultOptions,
} from '../../submission/submission-part/interfaces/default-options.interface';

export interface FurryNetworkFileOptions extends DefaultFileOptions {
  profile?: string;
  folders: string[];
  communityTags: boolean;
}

export interface FurryNetworkNotificationOptions extends DefaultOptions {
  profile?: string;
  folders: string[];
  communityTags: boolean;
}
