import { Expose } from 'class-transformer';
import { IsArray, IsBoolean } from 'class-validator';
import { DefaultFileOptions } from '../../interfaces/submission/default-options.interface';
import { TelegramFileOptions } from '../../interfaces/websites/telegram/telegram.file.options.interface';
import { DefaultValue } from '../../models/decorators/default-value.decorator';
import { DefaultFileOptionsEntity } from '../../models/default-file-options.entity';

export class TelegramFileOptionsEntity extends DefaultFileOptionsEntity
  implements TelegramFileOptions {
  @Expose()
  @IsBoolean()
  @DefaultValue(false)
  silent!: boolean;

  @Expose()
  @IsArray()
  @DefaultValue([])
  channels!: string[];

  constructor(entity?: Partial<TelegramFileOptions>) {
    super(entity as DefaultFileOptions);
  }
}
