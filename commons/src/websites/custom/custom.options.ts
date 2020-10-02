import { DefaultFileOptionsEntity } from '../../models/default-file-options.entity';
import { DefaultOptionsEntity } from '../../models/default-options.entity';

export class Custom {
  static readonly FileOptions = DefaultFileOptionsEntity;
  static readonly NotificationOptions = DefaultOptionsEntity;
}
