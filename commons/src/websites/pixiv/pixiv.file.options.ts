import { Expose } from 'class-transformer';
import { IsArray, IsBoolean, IsOptional, IsString } from 'class-validator';
import { DefaultFileOptions } from '../../interfaces/submission/default-options.interface';
import { PixivFileOptions } from '../../interfaces/websites/pixiv/pixiv.file.options.interface';
import { DefaultValue } from '../../models/decorators/default-value.decorator';
import { DefaultFileOptionsEntity } from '../../models/default-file-options.entity';

export class PixivFileOptionsEntity extends DefaultFileOptionsEntity implements PixivFileOptions {
  @Expose()
  @IsBoolean()
  @DefaultValue(true)
  communityTags!: boolean;

  @Expose()
  @IsArray()
  @DefaultValue([])
  matureContent!: string[];

  @Expose()
  @IsBoolean()
  @DefaultValue(true)
  original!: boolean;

  @Expose()
  @IsOptional()
  @IsBoolean()
  sexual?: boolean;

  @Expose()
  @IsArray()
  @DefaultValue([])
  containsContent!: string[];

  @Expose()
  @DefaultValue(false)
  aiGenerated!: boolean;

  constructor(entity?: Partial<PixivFileOptions>) {
    super(entity as DefaultFileOptions);
  }
}
