import { Expose } from 'class-transformer';
import { IsString } from 'class-validator';
import { DefaultOptions } from '../../interfaces/submission/default-options.interface';
import { NewTumblNotificationOptions } from '../../interfaces/websites/new-tumbl/new-tumbl.notification.options.interface';
import { DefaultValue } from '../../models/decorators/default-value.decorator';
import { DefaultOptionsEntity } from '../../models/default-options.entity';

export class NewTumblNotificationOptionsEntity extends DefaultOptionsEntity
  implements NewTumblNotificationOptions {
  @Expose()
  @IsString()
  @DefaultValue('')
  blog!: string;

  constructor(entity?: Partial<NewTumblNotificationOptions>) {
    super(entity as DefaultOptions);
  }
}
