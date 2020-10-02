import { DefaultFileOptions } from '../../submission/default-options.interface';

export interface SubscribeStarFileOptions extends DefaultFileOptions {
  tier?: string;
  useTitle: boolean;
}
