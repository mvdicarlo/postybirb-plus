import { DefaultOptionsEntity } from '../../models/default-options.entity';
import { FurbooruFileOptionsEntity } from './furbooru.file.options';

export class Furbooru {
  static readonly FileOptions = FurbooruFileOptionsEntity;
  static readonly NotificationOptions = DefaultOptionsEntity;
}
