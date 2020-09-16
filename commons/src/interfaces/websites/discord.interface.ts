import {
  DefaultFileOptions,
  DefaultOptions,
} from '../submission/default-options.interface';

export interface DiscordFileOptions extends DefaultFileOptions {
  spoiler: boolean;
  useTitle: boolean;
}

export interface DiscordNotificationOptions extends DefaultOptions {
  useTitle: boolean;
}
