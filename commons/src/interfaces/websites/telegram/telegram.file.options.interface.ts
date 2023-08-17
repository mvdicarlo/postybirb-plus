import { DefaultFileOptions } from '../../submission/default-options.interface';

export interface TelegramFileOptions extends DefaultFileOptions {
  silent: boolean;
  spoiler: boolean;
  channels: string[];
}
