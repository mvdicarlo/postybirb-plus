import { Expose } from 'class-transformer';
import { IsBoolean, IsOptional, IsString } from 'class-validator';
import { DefaultFileOptions } from '../../interfaces/submission/default-options.interface';
import {
  NewgroundsFileOptions,
  NewgroundsRating,
} from '../../interfaces/websites/newgrounds/newgrounds.file.options.interface';
import { DefaultValue } from '../../models/decorators/default-value.decorator';
import { DefaultFileOptionsEntity } from '../../models/default-file-options.entity';

export class NewgroundsFileOptionsEntity
  extends DefaultFileOptionsEntity
  implements NewgroundsFileOptions
{
  @Expose()
  @IsBoolean()
  @DefaultValue(false)
  creativeCommons!: boolean;

  @Expose()
  @IsBoolean()
  @DefaultValue(false)
  commercial!: boolean;

  @Expose()
  @IsBoolean()
  @DefaultValue(true)
  modification!: boolean;

  @Expose()
  @IsBoolean()
  @DefaultValue(false)
  sketch!: boolean;

  @Expose()
  @IsString()
  @DefaultValue('1')
  category!: string;

  @Expose()
  @IsOptional()
  @IsString()
  nudity?: NewgroundsRating;

  @Expose()
  @IsOptional()
  @IsString()
  violence?: NewgroundsRating;

  @Expose()
  @IsOptional()
  @IsString()
  explicitText?: NewgroundsRating;

  @Expose()
  @IsOptional()
  @IsString()
  adultThemes?: NewgroundsRating;

  constructor(entity?: Partial<NewgroundsFileOptions>) {
    super(entity as DefaultFileOptions);
  }
}
