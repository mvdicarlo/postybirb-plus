import { Expose } from 'class-transformer';
import { IsBoolean, IsString } from 'class-validator';
import { DefaultFileOptions } from '../../interfaces/submission/default-options.interface';
import { SoFurryFileOptions } from '../../interfaces/websites/so-furry/so-furry.file.options.interface';
import { DefaultValue } from '../../models/decorators/default-value.decorator';
import { DefaultFileOptionsEntity } from '../../models/default-file-options.entity';

export class SoFurryFileOptionsEntity
  extends DefaultFileOptionsEntity
  implements SoFurryFileOptions
{
  @Expose()
  @IsString()
  @DefaultValue('0')
  folder?: string;

  @Expose()
  @IsString()
  @DefaultValue('')
  category!: string;

  @Expose()
  @IsString()
  @DefaultValue('')
  type!: string;

  @Expose()
  @IsString()
  @DefaultValue('3')
  privacy!: string;

  @Expose()
  @IsBoolean()
  @DefaultValue(true)
  allowComments!: boolean;

  @Expose()
  @IsBoolean()
  @DefaultValue(true)
  allowDownloads!: boolean;

  @Expose()
  @IsBoolean()
  @DefaultValue(false)
  intendedAsAdvertisement!: boolean;

  @Expose()
  @IsBoolean()
  @DefaultValue(false)
  isWip!: boolean;

  @Expose()
  @IsBoolean()
  @DefaultValue(false)
  pixelPerfectDisplay!: boolean;

  constructor(entity?: Partial<SoFurryFileOptions>) {
    super(entity as DefaultFileOptions);
  }
}
