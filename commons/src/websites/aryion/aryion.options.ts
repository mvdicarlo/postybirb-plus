import { DefaultOptionsEntity } from '../../models/default-options.entity';
import { AryionFileOptionsEntity } from './aryion.file.options';

export class Aryion {
  static readonly FileOptions = AryionFileOptionsEntity;
  static readonly NotificationOptions = DefaultOptionsEntity;
}
