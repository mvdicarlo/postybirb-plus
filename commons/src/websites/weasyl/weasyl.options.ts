import { DefaultOptionsEntity } from '../../models/default-options.entity';
import { WeasylFileOptionsEntity } from './weasyl.file.options';

export class Weasyl {
  static readonly FileOptions = WeasylFileOptionsEntity;
  static readonly NotificationOptions = DefaultOptionsEntity;
}
