import { Expose } from 'class-transformer';
import { IsString } from 'class-validator';
import { DefaultFileOptions } from '../../interfaces/submission/default-options.interface';
import { TwitterFileOptions } from '../../interfaces/websites/twitter/twitter.file.options.interface';
import { DefaultFileOptionsEntity } from '../../models/default-file-options.entity';

export class TwitterFileOptionsEntity
  extends DefaultFileOptionsEntity
  implements TwitterFileOptions
{
  @Expose()
  @IsString()
  contentBlur?: 'other' | 'graphic_violence' | 'adult_content';

  constructor(entity?: Partial<TwitterFileOptions>) {
    super(entity as DefaultFileOptions);
  }
}