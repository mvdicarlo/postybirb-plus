import { Expose } from 'class-transformer';
import { IsString } from 'class-validator';
import { DefaultFileOptions } from '../../interfaces/submission/default-options.interface';
import { NewTumblFileOptions } from '../../interfaces/websites/new-tumbl/new-tumbl.file.options.interface';
import { DefaultValue } from '../../models/decorators/default-value.decorator';
import { DefaultFileOptionsEntity } from '../../models/default-file-options.entity';

export class NewTumblFileOptionsEntity extends DefaultFileOptionsEntity
  implements NewTumblFileOptions {
  @Expose()
  @IsString()
  @DefaultValue('')
  blog!: string;

  constructor(entity?: Partial<NewTumblFileOptions>) {
    super(entity as DefaultFileOptions);
  }
}
