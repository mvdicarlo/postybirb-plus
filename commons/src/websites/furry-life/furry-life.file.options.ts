import { Expose } from 'class-transformer';
import { IsArray, IsOptional, IsString } from 'class-validator';
import { DefaultFileOptions } from '../../interfaces/submission/default-options.interface';
import { FurryLifeFileOptions } from '../../interfaces/websites/furry-life/furry-life.file.options.interface';
import { DefaultValue } from '../../models/decorators/default-value.decorator';
import { DefaultFileOptionsEntity } from '../../models/default-file-options.entity';

export class FurryLifeFileOptionsEntity
  extends DefaultFileOptionsEntity
  implements FurryLifeFileOptions
{
  @Expose()
  @IsOptional()
  @IsString()
  credit?: string;

  @Expose()
  @IsOptional()
  @IsString()
  copyright?: string;

  @Expose()
  @IsString()
  @DefaultValue('general-sfw.712-sfw')
  album!: string;

  constructor(entity?: Partial<FurryLifeFileOptions>) {
    super(entity as DefaultFileOptions);
  }
}
