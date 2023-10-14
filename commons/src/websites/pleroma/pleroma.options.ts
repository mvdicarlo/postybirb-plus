import { PleromaFileOptionsEntity } from './pleroma.file.options';
import { PleromaNotificationOptionsEntity } from './pleroma.notification.options';

export class Pleroma {
  static readonly FileOptions = PleromaFileOptionsEntity;
  static readonly NotificationOptions = PleromaNotificationOptionsEntity;
}
