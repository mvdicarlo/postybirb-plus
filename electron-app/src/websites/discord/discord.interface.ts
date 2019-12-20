import { DefaultFileOptions } from '../../submission/interfaces/default-options.interface';

export interface DefaultDiscordOptions extends DefaultFileOptions {
  embed: boolean;
  spoiler: boolean;
}
