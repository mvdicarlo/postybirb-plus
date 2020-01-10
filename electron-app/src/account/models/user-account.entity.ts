import { UserAccount } from '../interfaces/user-account.interface';
import Entity from 'src/base/entity/entity.base';
import { IsNotEmpty, IsString, IsOptional } from 'class-validator';

export default class UserAccountEntity extends Entity implements UserAccount {
  @IsNotEmpty()
  @IsString()
  alias: string;

  @IsOptional()
  data: any;

  @IsNotEmpty()
  @IsString()
  website: string;
}
