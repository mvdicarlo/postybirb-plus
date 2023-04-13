import { Expose } from 'class-transformer';
import { IsArray, IsBoolean, IsOptional, IsString } from 'class-validator';
import { DefaultFileOptions } from '../../interfaces/submission/default-options.interface';
import { KoFiFileOptions } from '../../interfaces/websites/ko-fi/ko-fi.file.options.interface';
import { DefaultValue } from '../../models/decorators/default-value.decorator';
import { DefaultFileOptionsEntity } from '../../models/default-file-options.entity';

export class KoFiFileOptionsEntity extends DefaultFileOptionsEntity implements KoFiFileOptions {
  @Expose()
  @IsOptional()
  @IsString()
  album?: string;

  @Expose()
  @IsBoolean()
  @DefaultValue(false)
  hiRes!: boolean;

  @Expose()
  @IsString()
  @DefaultValue('public')
  audience!: 'public' | 'supporter' | 'recurringSupporter';

  constructor(entity?: Partial<KoFiFileOptions>) {
    super(entity as DefaultFileOptions);
  }
}
