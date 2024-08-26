import { CohostFileOptionsEntity } from './cohost.file.options';
import { CohostNotificationOptionsEntity } from './cohost.notification.options';

export class Cohost {
  static readonly FileOptions = CohostFileOptionsEntity;
  static readonly NotificationOptions = CohostNotificationOptionsEntity;
}
