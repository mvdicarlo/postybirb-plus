import { Expose } from 'class-transformer';
import { IsArray, IsString, IsOptional, IsBoolean } from 'class-validator';
import { DefaultOptions } from '../../interfaces/submission/default-options.interface';
import { CohostNotificationOptions } from '../../interfaces/websites/cohost/cohost.notification.options.interface';
import { DefaultValue } from '../../models/decorators/default-value.decorator';
import { DefaultOptionsEntity } from '../../models/default-options.entity';

export class CohostNotificationOptionsEntity
  extends DefaultOptionsEntity
  implements CohostNotificationOptions
{
  @Expose()
  @IsString()
  @IsOptional()
  spoilerText?: string;

  @Expose()
  @IsBoolean()
  @IsOptional()
  spoilerTextOverwrite?: boolean;

  constructor(entity?: Partial<CohostNotificationOptions>) {
    super(entity as DefaultOptions);
  }
}
