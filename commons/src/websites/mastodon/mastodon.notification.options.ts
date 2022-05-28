import { Expose } from 'class-transformer';
import { IsBoolean, IsOptional, IsString } from 'class-validator';
import { DefaultOptions } from '../../interfaces/submission/default-options.interface';
import { MastodonNotificationOptions } from '../../interfaces/websites/mastodon/mastodon.notification.options.interface';
import { DefaultValue } from '../../models/decorators/default-value.decorator';
import { DefaultOptionsEntity } from '../../models/default-options.entity';

export class MastodonNotificationOptionsEntity extends DefaultOptionsEntity
  implements MastodonNotificationOptions {
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

  constructor(entity?: Partial<MastodonNotificationOptions>) {
    super(entity as DefaultOptions);
  }
}
