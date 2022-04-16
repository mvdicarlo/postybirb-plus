import { DefaultOptionsEntity } from '../../models/default-options.entity';
import { ManebooruFileOptionsEntity } from './manebooru.file.options';

export class Manebooru {
  static readonly FileOptions = ManebooruFileOptionsEntity;
  static readonly NotificationOptions = DefaultOptionsEntity;
}
