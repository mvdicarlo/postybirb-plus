import { PatreonFileOptions, PatreonNotificationOptions } from './patreon.interface';
import {
  GenericDefaultFileOptions,
  GenericDefaultNotificationOptions,
} from '../generic/generic.defaults';

export const PatreonDefaultFileOptions: PatreonFileOptions = {
  ...GenericDefaultFileOptions,
  tiers: [],
  charge: false,
};

export const PatreonDefaultNotificationOptions: PatreonNotificationOptions = {
  ...GenericDefaultNotificationOptions,
  tiers: [],
  charge: false,
};
