import { DefaultOptionsEntity } from '../../models/default-options.entity';
import { DerpibooruFileOptionsEntity } from './derpibooru.file.options';

export class Derpibooru {
  static readonly FileOptions = DerpibooruFileOptionsEntity;
  static readonly NotificationOptions = DefaultOptionsEntity;
}
