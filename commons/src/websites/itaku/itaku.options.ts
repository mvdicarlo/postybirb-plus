import { DefaultOptionsEntity } from '../../models/default-options.entity';
import { ItakuFileOptionsEntity } from './itaku.file.options';

export class Itaku {
  static readonly FileOptions = ItakuFileOptionsEntity;
  static readonly NotificationOptions = DefaultOptionsEntity;
}
