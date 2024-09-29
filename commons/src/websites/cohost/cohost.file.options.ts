import { Expose } from 'class-transformer';
import { IsArray, IsBoolean, IsOptional, IsString } from 'class-validator';
import { DefaultFileOptions } from '../../interfaces/submission/default-options.interface';
import { CohostFileOptions } from '../../interfaces/websites/cohost/cohost.file.options.interface';
import { DefaultValue } from '../../models/decorators/default-value.decorator';
import { DefaultFileOptionsEntity } from '../../models/default-file-options.entity';

export class CohostFileOptionsEntity extends DefaultFileOptionsEntity implements CohostFileOptions {
  @Expose()
  @IsString()
  @IsOptional()
  spoilerText?: string;

  @Expose()
  @IsBoolean()
  @IsOptional()
  spoilerTextOverwrite?: boolean;

  constructor(entity?: Partial<CohostFileOptions>) {
    super(entity as DefaultFileOptions);
  }
}
