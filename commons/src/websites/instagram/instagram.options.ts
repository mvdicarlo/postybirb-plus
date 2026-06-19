import { DefaultOptionsEntity } from '../../models/default-options.entity';
import { InstagramFileOptionsEntity } from './instagram.file.options';

export class Instagram {
  static readonly FileOptions = InstagramFileOptionsEntity;
  static readonly NotificationOptions = DefaultOptionsEntity;
}
