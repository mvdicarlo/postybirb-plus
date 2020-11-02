import { Expose } from 'class-transformer';
import { IsBoolean, IsOptional, IsString } from 'class-validator';
import { DefaultFileOptions } from '../../interfaces/submission/default-options.interface';
import { TumblrFileOptions } from '../../interfaces/websites/tumblr/tumblr.file.options.interface';
import { DefaultValue } from '../../models/decorators/default-value.decorator';
import { DefaultFileOptionsEntity } from '../../models/default-file-options.entity';

export class TumblrFileOptionsEntity extends DefaultFileOptionsEntity implements TumblrFileOptions {
  @Expose()
  @IsOptional()
  @IsString()
  blog?: string;

  @Expose()
  @IsBoolean()
  @DefaultValue(true)
  useTitle!: boolean;

  constructor(entity?: Partial<TumblrFileOptions>) {
    super(entity as DefaultFileOptions);
  }
}
