import { Expose } from 'class-transformer';
import { IsArray, IsBoolean, IsDate, IsDateString, IsOptional, IsString } from 'class-validator';
import { DefaultFileOptions } from '../../interfaces/submission/default-options.interface';
import { PatreonFileOptions } from '../../interfaces/websites/patreon/patreon.file.options.interface';
import { DefaultValue } from '../../models/decorators/default-value.decorator';
import { DefaultFileOptionsEntity } from '../../models/default-file-options.entity';

export class PatreonFileOptionsEntity
  extends DefaultFileOptionsEntity
  implements PatreonFileOptions
{
  @Expose()
  @IsArray()
  @DefaultValue(['0'])
  tiers!: string[];

  @Expose()
  @IsBoolean()
  @DefaultValue(false)
  charge!: boolean;

  @Expose()
  @IsOptional()
  @IsDateString()
  schedule?: string;

  @Expose()
  @IsOptional()
  @IsString()
  teaser?: string;

  @Expose()
  @IsBoolean()
  @DefaultValue(false)
  allAsAttachment!: boolean;

  @Expose()
  @IsOptional()
  @IsDate()
  earlyAccess?: Date;

  constructor(entity?: Partial<PatreonFileOptions>) {
    super(entity as DefaultFileOptions);
  }
}
