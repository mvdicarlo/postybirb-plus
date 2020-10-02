import { PatreonFileOptionsEntity } from './patreon.file.options';
import { PatreonNotificationOptionsEntity } from './patreon.notification.options';

export class Patreon {
  static readonly FileOptions = PatreonFileOptionsEntity;
  static readonly NotificationOptions = PatreonNotificationOptionsEntity;
}
