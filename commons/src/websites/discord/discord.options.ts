import { DiscordFileOptionsEntity } from './discord.file.options';
import { DiscordNotificationOptionsEntity } from './discord.notification.options';

export class Discord {
  static readonly FileOptions = DiscordFileOptionsEntity;
  static readonly NotificationOptions = DiscordNotificationOptionsEntity;
}
