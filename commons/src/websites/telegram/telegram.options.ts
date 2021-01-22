import { TelegramFileOptionsEntity } from './telegram.file.options';
import { TelegramNotificationOptionsEntity } from './telegram.notification.options';

export class Telegram {
  static readonly FileOptions = TelegramFileOptionsEntity;
  static readonly NotificationOptions = TelegramNotificationOptionsEntity;
}
