import { Expose } from 'class-transformer';
import { IsArray, IsBoolean, IsOptional, IsString } from 'class-validator';
import { DefaultOptions } from '../../interfaces/submission/default-options.interface';
import { FurryNetworkNotificationOptions } from '../../interfaces/websites/furry-network/furry-network.notification.options.interface';
import { DefaultValue } from '../../models/decorators/default-value.decorator';
import { DefaultOptionsEntity } from '../../models/default-options.entity';

export class FurryNetworkNotificationOptionsEntity
  extends DefaultOptionsEntity
  implements FurryNetworkNotificationOptions
{
  @Expose()
  @IsOptional()
  @IsString()
  profile?: string;

  @Expose()
  @IsArray()
  @DefaultValue([])
  folders!: string[];

  @Expose()
  @IsBoolean()
  @DefaultValue(true)
  communityTags!: boolean;

  constructor(entity?: Partial<FurryNetworkNotificationOptions>) {
    super(entity as DefaultOptions);
  }
}
