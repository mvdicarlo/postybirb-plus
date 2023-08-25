import { Expose } from 'class-transformer';
import { IsBoolean, IsOptional, IsString } from 'class-validator';
import { DefaultOptions } from '../../interfaces/submission/default-options.interface';
import { SubscribeStarNotificationOptions } from '../../interfaces/websites/subscribe-star/subscribe-star.notification.options.interface';
import { DefaultValue } from '../../models/decorators/default-value.decorator';
import { DefaultOptionsEntity } from '../../models/default-options.entity';

export class SubscribeStarNotificationOptionsEntity
  extends DefaultOptionsEntity
  implements SubscribeStarNotificationOptions
{
  @Expose()
  @IsOptional()
  @IsString()
  @DefaultValue([])
  tiers!: string[];

  @Expose()
  @IsBoolean()
  @DefaultValue(true)
  useTitle!: boolean;

  constructor(entity?: Partial<SubscribeStarNotificationOptions>) {
    super(entity as DefaultOptions);
  }
}
