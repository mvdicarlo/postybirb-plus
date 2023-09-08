import { Expose } from 'class-transformer';
import { IsBoolean } from 'class-validator';
import { DefaultOptions } from '../../interfaces/submission/default-options.interface';
import { DiscordNotificationOptions } from '../../interfaces/websites/discord/discord.notification.options.interface';
import { DefaultValue } from '../../models/decorators/default-value.decorator';
import { DefaultOptionsEntity } from '../../models/default-options.entity';

export class DiscordNotificationOptionsEntity
  extends DefaultOptionsEntity
  implements DiscordNotificationOptions
{
  @Expose()
  @IsBoolean()
  @DefaultValue(true)
  useTitle!: boolean;

  constructor(entity?: Partial<DiscordNotificationOptions>) {
    super(entity as DefaultOptions);
  }
}
