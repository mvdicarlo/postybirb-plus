import { Expose } from 'class-transformer';
import { IsBoolean, IsOptional, IsString } from 'class-validator';
import { DefaultFileOptions } from '../../interfaces/submission/default-options.interface';
import { PixelfedFileOptions } from '../../interfaces/websites/pixelfed/pixelfed.file.options.interface';
import { DefaultValue } from '../../models/decorators/default-value.decorator';
import { DefaultFileOptionsEntity } from '../../models/default-file-options.entity';

export class PixelfedFileOptionsEntity extends DefaultFileOptionsEntity
  implements PixelfedFileOptions {
  @Expose()
  @IsBoolean()
  @DefaultValue(false)
  useTitle!: boolean;

  @Expose()
  @IsOptional()
  @IsString()
  spoilerText?: string;
  
  @Expose()
  @IsString()
  @DefaultValue('public')
  visibility!: string;

  @Expose()
  @IsOptional()
  @IsString()
  altText?: string;
  

  constructor(entity?: Partial<PixelfedFileOptions>) {
    super(entity as DefaultFileOptions);
  }
}
