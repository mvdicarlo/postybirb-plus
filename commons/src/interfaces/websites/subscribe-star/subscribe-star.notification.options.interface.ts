import { DefaultOptions } from '../../submission/default-options.interface';

export interface SubscribeStarNotificationOptions extends DefaultOptions {
  tiers: string[];
  useTitle: boolean;
}
