import { DefaultOptionsEntity } from '../../models/default-options.entity';
import { HentaiFoundryFileOptionsEntity } from './hentai-foundry.file.options';

export class HentaiFoundry {
  static readonly FileOptions = HentaiFoundryFileOptionsEntity;
  static readonly NotificationOptions = DefaultOptionsEntity;
}
