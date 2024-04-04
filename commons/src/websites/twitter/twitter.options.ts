import { DefaultOptionsEntity } from '../../models/default-options.entity';
import { TwitterFileOptionsEntity } from './twitter.file.options';

export class Twitter {
  static readonly FileOptions = TwitterFileOptionsEntity;
  static readonly NotificationOptions = DefaultOptionsEntity;
}