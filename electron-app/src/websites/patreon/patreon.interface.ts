import {
  DefaultFileOptions,
  DefaultOptions,
} from '../../submission/submission-part/interfaces/default-options.interface';

export interface PatreonFileOptions extends DefaultFileOptions {
  tiers: string[];
  charge: boolean;
}

export interface PatreonNotificationOptions extends DefaultOptions {
  tiers: string[];
  charge: boolean;
}
