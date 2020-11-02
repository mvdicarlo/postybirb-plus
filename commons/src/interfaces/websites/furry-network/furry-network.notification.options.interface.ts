import { DefaultOptions } from '../../submission/default-options.interface';

export interface FurryNetworkNotificationOptions extends DefaultOptions {
  profile?: string;
  folders: string[];
  communityTags: boolean;
}
