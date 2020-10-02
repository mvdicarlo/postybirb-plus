import { DefaultFileOptions } from '../../submission/default-options.interface';

export interface FurryNetworkFileOptions extends DefaultFileOptions {
  profile?: string;
  folders: string[];
  communityTags: boolean;
}
