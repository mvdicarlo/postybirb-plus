import { DefaultOptionsEntity } from '../../models/default-options.entity';
import { e621FileOptionsEntity } from './e621.file.options';

// tslint:disable-next-line: class-name
export class e621 {
  static readonly FileOptions = e621FileOptionsEntity;
  static readonly NotificationOptions = DefaultOptionsEntity;
}
