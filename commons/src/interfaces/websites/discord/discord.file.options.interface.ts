import {
  DefaultFileOptions
} from '../../submission/default-options.interface';

export interface DiscordFileOptions extends DefaultFileOptions {
  spoiler: boolean;
  useTitle: boolean;
}
