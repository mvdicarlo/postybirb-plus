import { DefaultOptionsEntity } from '../../models/default-options.entity';
import { PixivFileOptionsEntity } from './pixiv.file.options';

export class Pixiv {
  static readonly FileOptions = PixivFileOptionsEntity;
  static readonly NotificationOptions = DefaultOptionsEntity;
}
