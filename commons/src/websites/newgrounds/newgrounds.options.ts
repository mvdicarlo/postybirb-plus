import { DefaultOptionsEntity } from '../../models/default-options.entity';
import { NewgroundsFileOptionsEntity } from './newgrounds.file.options';

export class Newgrounds {
  static readonly FileOptions = NewgroundsFileOptionsEntity;
  static readonly NotificationOptions = DefaultOptionsEntity;
}
