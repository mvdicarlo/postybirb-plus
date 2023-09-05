import { Expose } from 'class-transformer';
import { IsBoolean, IsOptional, IsString } from 'class-validator';
import { DefaultOptions } from '../../interfaces/submission/default-options.interface';
import { TumblrNotificationOptions } from '../../interfaces/websites/tumblr/tumblr.notification.options.interface';
import { DefaultValue } from '../../models/decorators/default-value.decorator';
import { DefaultOptionsEntity } from '../../models/default-options.entity';

export class TumblrNotificationOptionsEntity
  extends DefaultOptionsEntity
  implements TumblrNotificationOptions
{
  @Expose()
  @IsOptional()
  @IsString()
  blog?: string;

  @Expose()
  @IsBoolean()
  @DefaultValue(true)
  useTitle!: boolean;

  constructor(entity?: Partial<TumblrNotificationOptions>) {
    super(entity as DefaultOptions);
  }
}
