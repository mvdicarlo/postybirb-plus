import {
  DefaultFileOptions,
  DefaultOptions,
} from '../../submission/submission-part/interfaces/default-options.interface';

export interface DiscordFileOptions extends DefaultFileOptions {
  spoiler: boolean;
  useTitle: boolean;
  embedColor: number;
  sources: string[];
}

export interface DiscordNotificationOptions extends DefaultOptions {
  useTitle: boolean;
  embedColor: number;
}
