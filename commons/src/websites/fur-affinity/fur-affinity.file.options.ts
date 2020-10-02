import { Expose } from 'class-transformer';
import { IsArray, IsBoolean, IsString } from 'class-validator';
import { DefaultFileOptions } from '../../interfaces/submission/default-options.interface';
import { FurAffinityFileOptions } from '../../interfaces/websites/fur-affinity/fur-affinity.file.options.interface';
import { DefaultValue } from '../../models/decorators/default-value.decorator';
import { DefaultFileOptionsEntity } from '../../models/default-file-options.entity';

export class FurAffinityFileOptionsEntity extends DefaultFileOptionsEntity
  implements FurAffinityFileOptions {
  @Expose()
  @IsString()
  @DefaultValue('1')
  category!: string;

  @Expose()
  @IsBoolean()
  @DefaultValue(false)
  disableComments!: boolean;

  @Expose()
  @IsArray()
  @DefaultValue([])
  folders!: string[];

  @Expose()
  @IsString()
  @DefaultValue('0')
  gender!: string;

  @Expose()
  @IsBoolean()
  @DefaultValue(true)
  reupload!: boolean;

  @Expose()
  @IsBoolean()
  @DefaultValue(false)
  scraps!: boolean;

  @Expose()
  @IsString()
  @DefaultValue('1')
  species!: string;

  @Expose()
  @IsString()
  @DefaultValue('1')
  theme!: string;

  constructor(entity?: Partial<FurAffinityFileOptions>) {
    super(entity as DefaultFileOptions);
  }
}
