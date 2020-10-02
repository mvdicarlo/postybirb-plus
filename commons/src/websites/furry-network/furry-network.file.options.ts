import { Expose } from 'class-transformer';
import { IsArray, IsBoolean, IsOptional, IsString } from 'class-validator';
import { DefaultFileOptions } from '../../interfaces/submission/default-options.interface';
import { FurryNetworkFileOptions } from '../../interfaces/websites/furry-network/furry-network.file.options.interface';
import { DefaultValue } from '../../models/decorators/default-value.decorator';
import { DefaultFileOptionsEntity } from '../../models/default-file-options.entity';

export class FurryNetworkFileOptionsEntity extends DefaultFileOptionsEntity
  implements FurryNetworkFileOptions {
  @Expose()
  @IsOptional()
  @IsString()
  profile?: string;

  @Expose()
  @IsArray()
  @DefaultValue([])
  folders!: string[];

  @Expose()
  @IsBoolean()
  @DefaultValue(true)
  communityTags!: boolean;

  constructor(entity?: Partial<FurryNetworkFileOptions>) {
    super(entity as DefaultFileOptions);
  }
}
