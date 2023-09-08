import { Expose } from 'class-transformer';
import { IsBoolean, IsString } from 'class-validator';
import { DefaultFileOptions } from '../../interfaces/submission/default-options.interface';
import { SoFurryNotificationOptions } from '../../interfaces/websites/so-furry/so-furry.notification.options.interface';
import { DefaultValue } from '../../models/decorators/default-value.decorator';
import { DefaultOptionsEntity } from '../../models/default-options.entity';

export class SoFurryNotificationOptionsEntity
  extends DefaultOptionsEntity
  implements SoFurryNotificationOptions
{
  @Expose()
  @IsString()
  @DefaultValue('0')
  folder?: string;

  @Expose()
  @IsBoolean()
  @DefaultValue(false)
  thumbnailAsCoverArt!: boolean;

  @Expose()
  @IsString()
  @DefaultValue('0')
  viewOptions!: string;

  constructor(entity?: Partial<SoFurryNotificationOptions>) {
    super(entity as DefaultFileOptions);
  }
}
