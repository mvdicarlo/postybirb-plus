import { DefaultFileOptions } from '../../submission/default-options.interface';

export interface SubscribeStarFileOptions extends DefaultFileOptions {
  tiers: string[];
  useTitle: boolean;
}
