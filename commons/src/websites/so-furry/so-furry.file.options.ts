import { Expose } from 'class-transformer';
import { IsBoolean, IsString } from 'class-validator';
import { DefaultFileOptions } from '../../interfaces/submission/default-options.interface';
import { SoFurryFileOptions } from '../../interfaces/websites/so-furry/so-furry.file.options.interface';
import { DefaultValue } from '../../models/decorators/default-value.decorator';
import { DefaultFileOptionsEntity } from '../../models/default-file-options.entity';

export class SoFurryFileOptionsEntity extends DefaultFileOptionsEntity
  implements SoFurryFileOptions {
  @Expose()
  @IsString()
  @DefaultValue('0')
  folder?: string;

  @Expose()
  @IsBoolean()
  @DefaultValue(false)
  thumbnailAsCoverArt!: boolean;

  @Expose()
  @IsString()
  @DefaultValue('0')
  viewOptions!: string;

  constructor(entity?: Partial<SoFurryFileOptions>) {
    super(entity as DefaultFileOptions);
  }
}
