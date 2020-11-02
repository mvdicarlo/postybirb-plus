import { Expose } from 'class-transformer';
import { IsArray, IsBoolean, IsString } from 'class-validator';
import { DefaultFileOptions } from '../../interfaces/submission/default-options.interface';
import { DeviantArtFileOptions } from '../../interfaces/websites/deviant-art/deviant-art.file.options.interface';
import { DefaultValue } from '../../models/decorators/default-value.decorator';
import { DefaultFileOptionsEntity } from '../../models/default-file-options.entity';

export class DeviantArtFileOptionsEntity extends DefaultFileOptionsEntity
  implements DeviantArtFileOptions {
  @Expose()
  @IsBoolean()
  @DefaultValue(false)
  feature!: boolean;

  @Expose()
  @IsBoolean()
  @DefaultValue(false)
  disableComments!: boolean;

  @Expose()
  @IsBoolean()
  @DefaultValue(false)
  critique!: boolean;

  @Expose()
  @IsBoolean()
  @DefaultValue(false)
  freeDownload!: boolean;

  @Expose()
  @IsArray()
  @DefaultValue([])
  folders!: string[];

  @Expose()
  @IsArray()
  @DefaultValue([])
  matureClassification!: string[];

  @Expose()
  @IsString()
  @DefaultValue('')
  matureLevel!: string;

  @Expose()
  @IsString()
  @DefaultValue('0')
  displayResolution!: string;

  @Expose()
  @IsBoolean()
  @DefaultValue(false)
  scraps!: boolean;

  constructor(entity?: Partial<DeviantArtFileOptions>) {
    super(entity as DefaultFileOptions);
  }
}
