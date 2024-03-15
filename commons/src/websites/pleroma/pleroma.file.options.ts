import { Expose } from 'class-transformer';
import { IsBoolean, IsOptional, IsString } from 'class-validator';
import { DefaultFileOptions } from '../../interfaces/submission/default-options.interface';
import { PleromaFileOptions } from '../../interfaces/websites/pleroma/pleroma.file.options.interface';
import { DefaultValue } from '../../models/decorators/default-value.decorator';
import { DefaultFileOptionsEntity } from '../../models/default-file-options.entity';

export class PleromaFileOptionsEntity extends DefaultFileOptionsEntity
  implements PleromaFileOptions {
  @Expose()
  @IsBoolean()
  @DefaultValue(false)
  useTitle!: boolean;

  @Expose()
  @IsOptional()
  @IsString()
  spoilerText?: string;

  @Expose()
  @IsBoolean()
  @IsOptional()
  spoilerTextOverwrite?: boolean;

  @Expose()
  @IsString()
  @DefaultValue('public')
  visibility!: string;

  @Expose()
  @IsOptional()
  @IsString()
  altText?: string;
  
  @Expose()
  @IsOptional()
  @IsString()
  replyToUrl?: string;

  constructor(entity?: Partial<PleromaFileOptions>) {
    super(entity as DefaultFileOptions);
  }
}
