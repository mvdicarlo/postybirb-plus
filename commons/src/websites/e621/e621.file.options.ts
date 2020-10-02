import { Expose } from 'class-transformer';
import { IsArray, IsOptional, IsString } from 'class-validator';
import { DefaultFileOptions } from '../../interfaces/submission/default-options.interface';
import { e621FileOptions } from '../../interfaces/websites/e621/e621.file.options.interface';
import { DefaultValue } from '../../models/decorators/default-value.decorator';
import { DefaultFileOptionsEntity } from '../../models/default-file-options.entity';

// tslint:disable-next-line: class-name
export class e621FileOptionsEntity extends DefaultFileOptionsEntity implements e621FileOptions {
  @Expose()
  @IsArray()
  @DefaultValue([])
  sources!: string[];

  @Expose()
  @IsOptional()
  @IsString()
  parentId?: string;

  constructor(entity?: Partial<e621FileOptions>) {
    super(entity as DefaultFileOptions);
  }
}
