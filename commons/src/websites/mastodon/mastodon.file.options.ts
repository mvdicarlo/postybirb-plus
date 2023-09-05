import { Expose } from 'class-transformer';
import { IsBoolean, IsOptional, IsString } from 'class-validator';
import { DefaultFileOptions } from '../../interfaces/submission/default-options.interface';
import { MastodonFileOptions } from '../../interfaces/websites/mastodon/mastodon.file.options.interface';
import { DefaultValue } from '../../models/decorators/default-value.decorator';
import { DefaultFileOptionsEntity } from '../../models/default-file-options.entity';

export class MastodonFileOptionsEntity
  extends DefaultFileOptionsEntity
  implements MastodonFileOptions
{
  @Expose()
  @IsBoolean()
  @DefaultValue(false)
  useTitle!: boolean;

  @Expose()
  @IsOptional()
  @IsString()
  spoilerText?: string;

  @Expose()
  @IsString()
  @DefaultValue('public')
  visibility!: string;

  @Expose()
  @IsOptional()
  @IsString()
  altText?: string;

  constructor(entity?: Partial<MastodonFileOptions>) {
    super(entity as DefaultFileOptions);
  }
}
