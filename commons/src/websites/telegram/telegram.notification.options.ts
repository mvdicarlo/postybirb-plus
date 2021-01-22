import { Expose } from 'class-transformer';
import { IsArray, IsBoolean } from 'class-validator';
import { DefaultOptions } from '../../interfaces/submission/default-options.interface';
import { TelegramNotificationOptions } from '../../interfaces/websites/telegram/telegram.notification.options.interface';
import { DefaultValue } from '../../models/decorators/default-value.decorator';
import { DefaultOptionsEntity } from '../../models/default-options.entity';

export class TelegramNotificationOptionsEntity extends DefaultOptionsEntity
  implements TelegramNotificationOptions {
  @Expose()
  @IsBoolean()
  @DefaultValue(false)
  silent!: boolean;

  @Expose()
  @IsArray()
  @DefaultValue([])
  channels!: string[];

  constructor(entity?: Partial<TelegramNotificationOptions>) {
    super(entity as DefaultOptions);
  }
}
