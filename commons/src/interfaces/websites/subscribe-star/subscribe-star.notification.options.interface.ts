import { DefaultOptions } from '../../submission/default-options.interface';

export interface SubscribeStarNotificationOptions extends DefaultOptions {
  tier?: string;
  useTitle: boolean;
}
