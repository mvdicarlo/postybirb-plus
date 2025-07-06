import { Expose } from 'class-transformer';
import { IsBoolean } from 'class-validator';
import { IsNumber } from 'class-validator';
import { DefaultFileOptions } from '../../interfaces/submission/default-options.interface';
import { DiscordFileOptions } from '../../interfaces/websites/discord/discord.file.options.interface';
import { DefaultValue } from '../../models/decorators/default-value.decorator';
import { DefaultFileOptionsEntity } from '../../models/default-file-options.entity';

export class DiscordFileOptionsEntity
  extends DefaultFileOptionsEntity
  implements DiscordFileOptions
{
  @Expose()
  @IsBoolean()
  @DefaultValue(false)
  spoiler!: boolean;
  
  @Expose()
  @IsNumber()
  @DefaultValue(10)
  filesizelimit!: number;

  @Expose()
  @IsBoolean()
  @DefaultValue(true)
  useTitle!: boolean;

  constructor(entity?: Partial<DiscordFileOptions>) {
    super(entity as DefaultFileOptions);
  }
}
