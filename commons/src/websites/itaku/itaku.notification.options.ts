import { Expose } from 'class-transformer';
import { IsArray, IsString } from 'class-validator';
import { DefaultOptions } from '../../interfaces/submission/default-options.interface';
import { ItakuNotificationOptions } from '../../interfaces/websites/itaku/itaku.notification.options.interface';
import { DefaultValue } from '../../models/decorators/default-value.decorator';
import { DefaultOptionsEntity } from '../../models/default-options.entity';

export class ItakuNotificationOptionsEntity extends DefaultOptionsEntity
  implements ItakuNotificationOptions {
  @Expose()
  @IsArray()
  @DefaultValue([])
  folders!: string[];

  @Expose()
  @IsString()
  @DefaultValue('PUBLIC')
  visibility!: string;

  constructor(entity?: Partial<ItakuNotificationOptions>) {
    super(entity as DefaultOptions);
  }
}
