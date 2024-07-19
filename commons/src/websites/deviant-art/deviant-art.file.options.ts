import { Expose } from 'class-transformer';
import { IsArray, IsBoolean, IsString } from 'class-validator';
import { DefaultFileOptions } from '../../interfaces/submission/default-options.interface';
import { DeviantArtFileOptions } from '../../interfaces/websites/deviant-art/deviant-art.file.options.interface';
import { DefaultValue } from '../../models/decorators/default-value.decorator';
import { DefaultFileOptionsEntity } from '../../models/default-file-options.entity';

export class DeviantArtFileOptionsEntity
  extends DefaultFileOptionsEntity
  implements DeviantArtFileOptions
{
  @Expose()
  @IsBoolean()
  @DefaultValue(false)
  disableComments!: boolean;

  @Expose()
  @IsBoolean()
  @DefaultValue(false)
  freeDownload!: boolean;

  @Expose()
  @IsArray()
  @DefaultValue([])
  folders!: string[];

  @Expose()
  @IsString()
  @DefaultValue(0)
  displayResolution!: string;

  @Expose()
  @IsBoolean()
  @DefaultValue(false)
  scraps!: boolean;

  @Expose()
  @IsBoolean()
  @DefaultValue(false)
  isMature!: boolean;

  @Expose()
  @IsBoolean()
  @DefaultValue(false)
  isAIGenerated!: boolean;

  @Expose()
  @IsBoolean()
  @DefaultValue(true)
  noAI!: boolean;

  @Expose()
  @IsBoolean()
  @DefaultValue(false)
  isCreativeCommons!: boolean;

  @Expose()
  @IsBoolean()
  @DefaultValue(false)
  isCommercialUse!: boolean;

  @Expose()
  @IsString()
  @DefaultValue('no')
  allowModifications!: string;

  constructor(entity?: Partial<DeviantArtFileOptions>) {
    super(entity as DefaultFileOptions);
  }
}
