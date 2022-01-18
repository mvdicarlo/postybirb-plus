import { Expose } from 'class-transformer';
import { IsArray, IsBoolean, IsOptional, IsString } from 'class-validator';
import { DefaultFileOptions } from '../../interfaces/submission/default-options.interface';
import { ItakuFileOptions } from '../../interfaces/websites/itaku/itaku.file.options.interface';
import { DefaultValue } from '../../models/decorators/default-value.decorator';
import { DefaultFileOptionsEntity } from '../../models/default-file-options.entity';

export class ItakuFileOptionsEntity extends DefaultFileOptionsEntity implements ItakuFileOptions {
  @Expose()
  @IsArray()
  @DefaultValue([])
  folders!: string[];

  @Expose()
  @IsString()
  @DefaultValue('PUBLIC')
  visibility!: string;

  @Expose()
  @IsBoolean()
  @DefaultValue(true)
  shareOnFeed!: boolean;

  constructor(entity?: Partial<ItakuFileOptions>) {
    super(entity as DefaultFileOptions);
  }
}
