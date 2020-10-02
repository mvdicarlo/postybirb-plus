import { Expose } from 'class-transformer';
import { IsBoolean } from 'class-validator';
import { DefaultOptions } from '../../interfaces/submission/default-options.interface';
import { FurAffinityNotificationOptions } from '../../interfaces/websites/fur-affinity/fur-affinity.notification.options.interface';
import { DefaultValue } from '../../models/decorators/default-value.decorator';
import { DefaultOptionsEntity } from '../../models/default-options.entity';

export class FurAffinityNotificationOptionsEntity extends DefaultOptionsEntity
  implements FurAffinityNotificationOptions {
  @Expose()
  @IsBoolean()
  @DefaultValue(true)
  feature!: boolean;

  constructor(entity?: Partial<FurAffinityNotificationOptions>) {
    super(entity as DefaultOptions);
  }
}
