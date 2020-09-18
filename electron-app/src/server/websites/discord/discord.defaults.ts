import { DiscordFileOptions, DiscordNotificationOptions } from 'postybirb-commons';
import {
  GenericDefaultFileOptions,
  GenericDefaultNotificationOptions,
} from '../generic/generic.defaults';

export const DiscordDefaultFileOptions: DiscordFileOptions = {
  ...GenericDefaultFileOptions,
  spoiler: false,
  useTitle: true,
};

export const DiscordDefaultNotificationOptions: DiscordNotificationOptions = {
  ...GenericDefaultNotificationOptions,
  useTitle: true,
};
