import { Expose } from 'class-transformer';
import { IsArray, IsBoolean, IsDateString, IsOptional } from 'class-validator';
import { DefaultOptions } from '../../interfaces/submission/default-options.interface';
import { PatreonNotificationOptions } from '../../interfaces/websites/patreon/patreon.notification.options.interface';
import { DefaultValue } from '../../models/decorators/default-value.decorator';
import { DefaultOptionsEntity } from '../../models/default-options.entity';

export class PatreonNotificationOptionsEntity extends DefaultOptionsEntity
  implements PatreonNotificationOptions {
  @Expose()
  @IsArray()
  @DefaultValue([])
  tiers!: string[];

  @Expose()
  @IsBoolean()
  @DefaultValue(false)
  charge!: boolean;

  @Expose()
  @IsOptional()
  @IsDateString()
  schedule?: string;

  constructor(entity?: Partial<PatreonNotificationOptions>) {
    super(entity as DefaultOptions);
  }
}
