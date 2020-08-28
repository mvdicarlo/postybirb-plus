import { UserAccount } from '../interfaces/user-account.interface';
import Entity from 'src/server/database/models/entity.model';
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

  constructor(partial?: Partial<UserAccountEntity>) {
    super(partial);
  }
}
