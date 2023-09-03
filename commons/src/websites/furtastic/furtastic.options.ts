import { DefaultOptionsEntity } from '../../models/default-options.entity';
import { furtasticFileOptionsEntity } from './furtastic.file.options';

// tslint:disable-next-line: class-name
export class furtastic {
  static readonly FileOptions = furtasticFileOptionsEntity;
  static readonly NotificationOptions = DefaultOptionsEntity;
}
