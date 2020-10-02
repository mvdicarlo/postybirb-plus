import { DefaultOptionsEntity } from '../../models/default-options.entity';
import { FurryLifeFileOptionsEntity } from './furry-life.file.options';

export class FurryLife {
  static readonly FileOptions = FurryLifeFileOptionsEntity;
  static readonly NotificationOptions = DefaultOptionsEntity;
}
