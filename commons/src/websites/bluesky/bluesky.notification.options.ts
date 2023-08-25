import { Expose } from 'class-transformer';
import { IsBoolean, IsOptional, IsString } from 'class-validator';
import { DefaultOptions } from '../../interfaces/submission/default-options.interface';
import { BlueskyNotificationOptions } from '../../interfaces/websites/bluesky/bluesky.notification.options.interface';
import { DefaultValue } from '../../models/decorators/default-value.decorator';
import { DefaultOptionsEntity } from '../../models/default-options.entity';

export class BlueskyNotificationOptionsEntity
  extends DefaultOptionsEntity
  implements BlueskyNotificationOptions
{
  @Expose()
  @IsString()
  @DefaultValue('')
  label_rating: string = '';

  constructor(entity?: Partial<BlueskyNotificationOptions>) {
    super(entity as DefaultOptions);
  }
}
