import { DefaultFileOptions } from '../../submission/submission-part/interfaces/default-options.interface';

export interface DefaultDiscordOptions extends DefaultFileOptions {
  spoiler: boolean;
  useTitle: boolean;
}
