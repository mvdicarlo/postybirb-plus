import { Expose } from 'class-transformer';
import { IsBoolean, IsOptional, IsString } from 'class-validator';
import { DefaultFileOptions } from '../../interfaces/submission/default-options.interface';
import { HentaiFoundryFileOptions } from '../../interfaces/websites/hentai-foundry/hentai-foundry.file.options.interface';
import { DefaultValue } from '../../models/decorators/default-value.decorator';
import { DefaultFileOptionsEntity } from '../../models/default-file-options.entity';

export class HentaiFoundryFileOptionsEntity extends DefaultFileOptionsEntity
  implements HentaiFoundryFileOptions {
  @Expose()
  @IsBoolean()
  @DefaultValue(false)
  scraps!: boolean;

  @Expose()
  @IsBoolean()
  @DefaultValue(false)
  disableComments!: boolean;

  @Expose()
  @IsOptional()
  @IsString()
  category?: string;

  @Expose()
  @IsString()
  @DefaultValue('0')
  nudityRating!: string;

  @Expose()
  @IsString()
  @DefaultValue('0')
  violenceRating!: string;

  @Expose()
  @IsString()
  @DefaultValue('0')
  profanityRating!: string;

  @Expose()
  @IsString()
  @DefaultValue('0')
  racismRating!: string;

  @Expose()
  @IsString()
  @DefaultValue('0')
  sexRating!: string;

  @Expose()
  @IsString()
  @DefaultValue('0')
  spoilersRating!: string;

  @Expose()
  @IsBoolean()
  @DefaultValue(false)
  yaoi!: boolean;

  @Expose()
  @IsBoolean()
  @DefaultValue(false)
  yuri!: boolean;

  @Expose()
  @IsBoolean()
  @DefaultValue(false)
  teen!: boolean;

  @Expose()
  @IsBoolean()
  @DefaultValue(false)
  guro!: boolean;

  @Expose()
  @IsBoolean()
  @DefaultValue(false)
  furry!: boolean;

  @Expose()
  @IsBoolean()
  @DefaultValue(false)
  beast!: boolean;

  @Expose()
  @IsBoolean()
  @DefaultValue(false)
  male!: boolean;

  @Expose()
  @IsBoolean()
  @DefaultValue(false)
  female!: boolean;

  @Expose()
  @IsBoolean()
  @DefaultValue(false)
  futa!: boolean;

  @Expose()
  @IsBoolean()
  @DefaultValue(false)
  other!: boolean;

  @Expose()
  @IsBoolean()
  @DefaultValue(false)
  scat!: boolean;

  @Expose()
  @IsBoolean()
  @DefaultValue(false)
  incest!: boolean;

  @Expose()
  @IsBoolean()
  @DefaultValue(false)
  rape!: boolean;

  @Expose()
  @IsString()
  @DefaultValue('0')
  media!: string;

  @Expose()
  @IsOptional()
  @IsString()
  timeTaken?: string;

  @Expose()
  @IsString()
  @DefaultValue('0')
  license!: string;

  @Expose()
  @IsOptional()
  @IsString()
  reference?: string;

  constructor(entity?: Partial<HentaiFoundryFileOptions>) {
    super(entity as DefaultFileOptions);
  }
}
