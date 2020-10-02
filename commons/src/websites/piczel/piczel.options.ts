import { DefaultOptionsEntity } from '../../models/default-options.entity';
import { PiczelFileOptionsEntity } from './piczel.file.options';

export class Piczel {
  static readonly FileOptions = PiczelFileOptionsEntity;
  static readonly NotificationOptions = DefaultOptionsEntity;
}
