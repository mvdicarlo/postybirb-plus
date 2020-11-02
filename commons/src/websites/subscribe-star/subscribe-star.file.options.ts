import { Expose } from 'class-transformer';
import { IsBoolean, IsOptional, IsString } from 'class-validator';
import { DefaultFileOptions } from '../../interfaces/submission/default-options.interface';
import { SubscribeStarFileOptions } from '../../interfaces/websites/subscribe-star/subscribe-star.file.options.interface';
import { DefaultValue } from '../../models/decorators/default-value.decorator';
import { DefaultFileOptionsEntity } from '../../models/default-file-options.entity';

export class SubscribeStarFileOptionsEntity extends DefaultFileOptionsEntity
  implements SubscribeStarFileOptions {
  @Expose()
  @IsOptional()
  @IsString()
  tier?: string;

  @Expose()
  @IsBoolean()
  @DefaultValue(true)
  useTitle!: boolean;

  constructor(entity?: Partial<SubscribeStarFileOptions>) {
    super(entity as DefaultFileOptions);
  }
}
