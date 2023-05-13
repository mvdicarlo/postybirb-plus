import { MissKeyFileOptionsEntity } from './misskey.file.options';
import { MissKeyNotificationOptionsEntity } from './misskey.notification.options';

export class MissKey {
  static readonly FileOptions = MissKeyFileOptionsEntity;
  static readonly NotificationOptions = MissKeyNotificationOptionsEntity;
}
