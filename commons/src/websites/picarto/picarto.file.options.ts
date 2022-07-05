import { Expose } from 'class-transformer';
import { IsArray, IsBoolean, IsString } from 'class-validator';
import { DefaultFileOptions } from '../../interfaces/submission/default-options.interface';
import { PicartoFileOptions } from '../../interfaces/websites/picarto/picarto.file.options.interface';
import { DefaultValue } from '../../models/decorators/default-value.decorator';
import { DefaultFileOptionsEntity } from '../../models/default-file-options.entity';

export class PicartoFileOptionsEntity extends DefaultFileOptionsEntity
  implements PicartoFileOptions {
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
  @DefaultValue('EVERYONE')
  comments!: string;

  @Expose()
  @IsString()
  @DefaultValue('Creative')
  category!: string;

  @Expose()
  @IsArray()
  @DefaultValue([])
  softwares!: string[];

  @Expose()
  @IsBoolean()
  @DefaultValue(true)
  downloadSource!: boolean;

  constructor(entity?: Partial<PicartoFileOptions>) {
    super(entity as DefaultFileOptions);
  }
}
