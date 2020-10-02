import { DefaultOptionsEntity } from './default-options.entity';
import { DefaultFileOptions } from '../interfaces/submission/default-options.interface';
import { IsBoolean } from 'class-validator';
import { DefaultValue } from './decorators/default-value.decorator';
import { Expose } from 'class-transformer';

export class DefaultFileOptionsEntity extends DefaultOptionsEntity implements DefaultFileOptions {
  @Expose()
  @IsBoolean()
  @DefaultValue(true)
  useThumbnail!: boolean;

  @Expose()
  @IsBoolean()
  @DefaultValue(true)
  autoScale!: boolean;

  constructor(entity?: Partial<DefaultFileOptionsEntity>) {
    super(entity as DefaultOptionsEntity);
  }
}
