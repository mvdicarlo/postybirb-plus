import { Expose } from 'class-transformer';
import { IsString } from 'class-validator';
import { DefaultFileOptions } from '../../interfaces/submission/default-options.interface';
import { PiczelFileOptions } from '../../interfaces/websites/piczel/piczel.file.options.interface';
import { DefaultFileOptionsEntity } from '../../models/default-file-options.entity';

export class PiczelFileOptionsEntity extends DefaultFileOptionsEntity implements PiczelFileOptions {
  @Expose()
  @IsString()
  folder?: string;

  constructor(entity?: Partial<PiczelFileOptions>) {
    super(entity as DefaultFileOptions);
  }
}
