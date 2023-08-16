import { Expose } from 'class-transformer';
import { IsBoolean, IsOptional, IsString } from 'class-validator';
import { DefaultFileOptions } from '../../interfaces/submission/default-options.interface';
import { BlueskyFileOptions } from '../../interfaces/websites/bluesky/bluesky.file.options.interface';
import { DefaultValue } from '../../models/decorators/default-value.decorator';
import { DefaultFileOptionsEntity } from '../../models/default-file-options.entity';

export class BlueskyFileOptionsEntity extends DefaultFileOptionsEntity
  implements BlueskyFileOptions {

  @Expose()
  @IsOptional()
  @IsString()
  altText?: string;

  @Expose()
  @IsString()
  label_rating: string = '';
  

  constructor(entity?: Partial<BlueskyFileOptions>) {
    super(entity as DefaultFileOptions);
  }
}
