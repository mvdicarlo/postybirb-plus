import { Expose } from 'class-transformer';
import { IsBoolean, IsOptional, IsString } from 'class-validator';
import { DefaultFileOptions } from '../../interfaces/submission/default-options.interface';
import { WeasylFileOptions } from '../../interfaces/websites/weasyl/weasyl.file.options.interface';
import { DefaultValue } from '../../models/decorators/default-value.decorator';
import { DefaultFileOptionsEntity } from '../../models/default-file-options.entity';

export class WeasylFileOptionsEntity extends DefaultFileOptionsEntity implements WeasylFileOptions {
  @Expose()
  @IsOptional()
  @IsString()
  category?: string;

  @Expose()
  @IsBoolean()
  @DefaultValue(false)
  critique!: boolean;

  @Expose()
  @IsOptional()
  @IsString()
  folder?: string;

  @Expose()
  @IsBoolean()
  @DefaultValue(true)
  notify!: boolean;

  constructor(entity?: Partial<WeasylFileOptions>) {
    super(entity as DefaultFileOptions);
  }
}
