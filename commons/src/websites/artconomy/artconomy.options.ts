import { DefaultOptionsEntity } from '../../models/default-options.entity';
import { ArtconomyFileOptionsEntity } from './artconomy.file.options';

export class Artconomy {
  static readonly FileOptions = ArtconomyFileOptionsEntity;
  static readonly NotificationOptions = DefaultOptionsEntity;
}
