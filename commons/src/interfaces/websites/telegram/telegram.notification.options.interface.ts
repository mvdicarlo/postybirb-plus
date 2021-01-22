import { DefaultOptions } from '../../submission/default-options.interface';

export interface TelegramNotificationOptions extends DefaultOptions {
  silent: boolean;
  channels: string[];
}
