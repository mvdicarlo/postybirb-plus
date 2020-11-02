import { DefaultOptions } from '../../submission/default-options.interface';

export interface PatreonNotificationOptions extends DefaultOptions {
  tiers: string[];
  charge: boolean;
}
