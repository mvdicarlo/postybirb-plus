import { DefaultFileOptions } from '../../submission/default-options.interface';

export interface TelegramFileOptions extends DefaultFileOptions {
  silent: boolean;
  channels: string[];
}
