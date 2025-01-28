import { Expose } from 'class-transformer';
import { IsBoolean, IsString } from 'class-validator';
import { DefaultFileOptions } from '../../interfaces/submission/default-options.interface';
import { PillowfortFileOptions } from '../../interfaces/websites/pillowfort/pillowfort.file.options.interface';
import { DefaultValue } from '../../models/decorators/default-value.decorator';
import { DefaultFileOptionsEntity } from '../../models/default-file-options.entity';

export class PillowfortFileOptionsEntity
  extends DefaultFileOptionsEntity
  implements PillowfortFileOptions
{
  @Expose()
  @IsString()
  @DefaultValue('public')
  privacy!: string;

  @Expose()
  @IsBoolean()
  @DefaultValue(true)
  allowComments!: boolean;

  @Expose()
  @IsBoolean()
  @DefaultValue(true)
  allowReblogging!: boolean;

  @Expose()
  @IsBoolean()
  @DefaultValue(true)
  useTitle!: boolean;

  constructor(entity?: Partial<PillowfortFileOptions>) {
    super(entity as DefaultFileOptions);
  }
}
