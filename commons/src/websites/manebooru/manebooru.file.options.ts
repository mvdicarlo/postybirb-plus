import { Expose } from 'class-transformer';
import { IsOptional, IsString } from 'class-validator';
import { DefaultFileOptions } from '../../interfaces/submission/default-options.interface';
import { ManebooruFileOptions } from '../../interfaces/websites/manebooru/manebooru.file.options.interface';
import { DefaultFileOptionsEntity } from '../../models/default-file-options.entity';

export class ManebooruFileOptionsEntity extends DefaultFileOptionsEntity
  implements ManebooruFileOptions {
  @Expose()
  @IsOptional()
  @IsString()
  source?: string;

  constructor(entity?: Partial<ManebooruFileOptions>) {
    super(entity as DefaultFileOptions);
  }
}
