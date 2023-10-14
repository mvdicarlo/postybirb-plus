import { Expose } from 'class-transformer';
import { IsBoolean, IsOptional, IsString } from 'class-validator';
import { DefaultOptions } from '../../interfaces/submission/default-options.interface';
import { PleromaNotificationOptions } from '../../interfaces/websites/pleroma/pleroma.notification.options.interface';
import { DefaultValue } from '../../models/decorators/default-value.decorator';
import { DefaultOptionsEntity } from '../../models/default-options.entity';

export class PleromaNotificationOptionsEntity extends DefaultOptionsEntity
  implements PleromaNotificationOptions {
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

  @Expose()
  @IsOptional()
  @IsString()
  replyToUrl?: string;

  constructor(entity?: Partial<PleromaNotificationOptions>) {
    super(entity as DefaultOptions);
  }
}
