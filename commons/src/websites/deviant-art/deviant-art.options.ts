import { DefaultOptionsEntity } from '../../models/default-options.entity';
import { DeviantArtFileOptionsEntity } from './deviant-art.file.options';

export class DeviantArt {
  static readonly FileOptions = DeviantArtFileOptionsEntity;
  static readonly NotificationOptions = DefaultOptionsEntity;
}
