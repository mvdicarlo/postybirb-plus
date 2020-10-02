import { DefaultOptionsEntity } from '../../models/default-options.entity';
import { InkbunnyFileOptionsEntity } from './inkbunny.file.options';

export class Inkbunny {
  static readonly FileOptions = InkbunnyFileOptionsEntity;
  static readonly NotificationOptions = DefaultOptionsEntity;
}
