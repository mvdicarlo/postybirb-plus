import { Expose } from 'class-transformer';
import { IsOptional, IsString } from 'class-validator';
import { DefaultFileOptions } from '../../interfaces/submission/default-options.interface';
import { DerpibooruFileOptions } from '../../interfaces/websites/derpibooru/derpibooru.file.options.interface';
import { DefaultFileOptionsEntity } from '../../models/default-file-options.entity';

export class DerpibooruFileOptionsEntity extends DefaultFileOptionsEntity
  implements DerpibooruFileOptions {
  @Expose()
  @IsOptional()
  @IsString()
  source?: string;

  constructor(entity?: Partial<DerpibooruFileOptions>) {
    super(entity as DefaultFileOptions);
  }
}
