import { Expose } from 'class-transformer';
import { IsBoolean, IsString } from 'class-validator';
import { DefaultOptions } from '../../interfaces/submission/default-options.interface';
import { PillowfortNotificationOptions } from '../../interfaces/websites/pillowfort/pillowfort.notification.options.interface';
import { DefaultValue } from '../../models/decorators/default-value.decorator';
import { DefaultOptionsEntity } from '../../models/default-options.entity';

export class PillowfortNotificationOptionsEntity
  extends DefaultOptionsEntity
  implements PillowfortNotificationOptions
{
  @Expose()
  @IsString()
  @DefaultValue('public')
  privacy!: string;

  @Expose()
  @IsBoolean()
  @DefaultValue(true)
  allowComments!: boolean;

  @Expose()
  @IsBoolean()
  @DefaultValue(true)
  allowReblogging!: boolean;

  @Expose()
  @IsBoolean()
  @DefaultValue(true)
  useTitle!: boolean;

  constructor(entity?: Partial<PillowfortNotificationOptions>) {
    super(entity as DefaultOptions);
  }
}
