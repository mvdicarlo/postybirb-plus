import { DefaultFileOptionsEntity } from '../../models/default-file-options.entity';
import { InkbunnyFileOptions } from '../../interfaces/websites/inkbunny/inkbunny.file.options.interface';
import { DefaultFileOptions } from '../../interfaces/submission/default-options.interface';
import { IsBoolean, IsOptional, IsString } from 'class-validator';
import { DefaultValue } from '../../models/decorators/default-value.decorator';
import { Expose } from 'class-transformer';

export class InkbunnyFileOptionsEntity
  extends DefaultFileOptionsEntity
  implements InkbunnyFileOptions
{
  @Expose()
  @IsBoolean()
  @DefaultValue(false)
  blockGuests!: boolean;

  @Expose()
  @IsBoolean()
  @DefaultValue(false)
  friendsOnly!: boolean;

  @Expose()
  @IsBoolean()
  @DefaultValue(true)
  notify!: boolean;

  @Expose()
  @IsBoolean()
  @DefaultValue(false)
  scraps!: boolean;

  @IsOptional()
  @IsString()
  submissionType?: string;

  constructor(entity?: Partial<InkbunnyFileOptions>) {
    super(entity as DefaultFileOptions);
  }
}
