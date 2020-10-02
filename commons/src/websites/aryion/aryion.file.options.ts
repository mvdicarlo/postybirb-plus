import { Expose } from 'class-transformer';
import { IsArray, IsBoolean, IsOptional, IsString } from 'class-validator';
import { DefaultFileOptions } from '../../interfaces/submission/default-options.interface';
import { AryionFileOptions } from '../../interfaces/websites/aryion/aryion.file.options.interface';
import { DefaultValue } from '../../models/decorators/default-value.decorator';
import { DefaultFileOptionsEntity } from '../../models/default-file-options.entity';

export class AryionFileOptionsEntity extends DefaultFileOptionsEntity implements AryionFileOptions {
  @Expose()
  @IsArray()
  @DefaultValue([])
  folder!: string[];

  @Expose()
  @IsString()
  @DefaultValue('ALL')
  viewPermissions!: string;

  @Expose()
  @IsString()
  @DefaultValue('USER')
  commentPermissions!: string;

  @Expose()
  @IsString()
  @DefaultValue('USER')
  tagPermissions!: string;

  @Expose()
  @IsOptional()
  @IsString()
  requiredTag?: string;

  @Expose()
  @IsBoolean()
  @DefaultValue(false)
  scraps!: boolean;

  constructor(entity?: Partial<AryionFileOptions>) {
    super(entity as DefaultFileOptions);
  }
}
