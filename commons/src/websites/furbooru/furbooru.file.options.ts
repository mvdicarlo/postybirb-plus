import { Expose } from 'class-transformer';
import { IsOptional, IsString } from 'class-validator';
import { DefaultFileOptions } from '../../interfaces/submission/default-options.interface';
import { FurbooruFileOptions } from '../../interfaces/websites/furbooru/furbooru.file.options.interface';
import { DefaultFileOptionsEntity } from '../../models/default-file-options.entity';

export class FurbooruFileOptionsEntity
  extends DefaultFileOptionsEntity
  implements FurbooruFileOptions
{
  @Expose()
  @IsOptional()
  @IsString()
  source?: string;

  constructor(entity?: Partial<FurbooruFileOptions>) {
    super(entity as DefaultFileOptions);
  }
}
