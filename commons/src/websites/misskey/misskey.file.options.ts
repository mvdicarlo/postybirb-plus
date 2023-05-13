import { Expose } from 'class-transformer';
import { IsBoolean, IsOptional, IsString } from 'class-validator';
import { DefaultFileOptions } from '../../interfaces/submission/default-options.interface';
import { MissKeyFileOptions } from '../../interfaces/websites/misskey/misskey.file.options.interface';
import { DefaultValue } from '../../models/decorators/default-value.decorator';
import { DefaultFileOptionsEntity } from '../../models/default-file-options.entity';

export class MissKeyFileOptionsEntity extends DefaultFileOptionsEntity
  implements MissKeyFileOptions {
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
  

  constructor(entity?: Partial<MissKeyFileOptions>) {
    super(entity as DefaultFileOptions);
  }
}
