import { DefaultFileOptions } from '../../interfaces/submission/default-options.interface';
import { InstagramFileOptions } from '../../interfaces/websites/instagram/instagram.file.options.interface';
import { DefaultFileOptionsEntity } from '../../models/default-file-options.entity';

export class InstagramFileOptionsEntity
  extends DefaultFileOptionsEntity
  implements InstagramFileOptions
{
  constructor(entity?: Partial<InstagramFileOptions>) {
    super(entity as DefaultFileOptions);
  }
}
