import { Expose } from 'class-transformer';
import { IsArray, IsString, IsOptional, IsBoolean } from 'class-validator';
import { DefaultOptions } from '../../interfaces/submission/default-options.interface';
import { ItakuNotificationOptions } from '../../interfaces/websites/itaku/itaku.notification.options.interface';
import { DefaultValue } from '../../models/decorators/default-value.decorator';
import { DefaultOptionsEntity } from '../../models/default-options.entity';

export class ItakuNotificationOptionsEntity
  extends DefaultOptionsEntity
  implements ItakuNotificationOptions
{
  @Expose()
  @IsArray()
  @DefaultValue([])
  folders!: string[];

  @Expose()
  @IsString()
  @DefaultValue('PUBLIC')
  visibility!: string;

  @Expose()
  @IsString()
  @IsOptional()
  spoilerText?: string;

  @Expose()
  @IsBoolean()
  @IsOptional()
  spoilerTextOverwrite?: boolean;

  constructor(entity?: Partial<ItakuNotificationOptions>) {
    super(entity as DefaultOptions);
  }
}
