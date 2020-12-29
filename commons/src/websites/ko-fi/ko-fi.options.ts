import { DefaultOptionsEntity } from '../../models/default-options.entity';
import { KoFiFileOptionsEntity } from './ko-fi.file.options';

export class KoFi {
  static readonly FileOptions = KoFiFileOptionsEntity;
  static readonly NotificationOptions = DefaultOptionsEntity;
}
