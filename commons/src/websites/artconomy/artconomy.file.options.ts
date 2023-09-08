import { Expose } from 'class-transformer';
import { IsBoolean } from 'class-validator';
import { DefaultFileOptions } from '../../interfaces/submission/default-options.interface';
import { ArtconomyFileOptions } from '../../interfaces/websites/artconomy/artconomy.file.options.interface';
import { DefaultValue } from '../../models/decorators/default-value.decorator';
import { DefaultFileOptionsEntity } from '../../models/default-file-options.entity';

export class ArtconomyFileOptionsEntity
  extends DefaultFileOptionsEntity
  implements ArtconomyFileOptions
{
  @Expose()
  @IsBoolean()
  @DefaultValue(false)
  commentsDisabled!: boolean;

  @Expose()
  @IsBoolean()
  @DefaultValue(true)
  isArtist!: boolean;

  @Expose()
  @IsBoolean()
  @DefaultValue(false)
  private!: boolean;

  constructor(entity?: Partial<ArtconomyFileOptions>) {
    super(entity as DefaultFileOptions);
  }
}
