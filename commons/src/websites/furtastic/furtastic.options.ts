import { DefaultOptionsEntity } from '../../models/default-options.entity';
import { FurtasticFileOptionsEntity } from './furtastic.file.options';

// tslint:disable-next-line: class-name
export class Furtastic {
  static readonly FileOptions = FurtasticFileOptionsEntity;
  static readonly NotificationOptions = DefaultOptionsEntity;
}
