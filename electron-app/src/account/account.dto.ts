import { IsNotEmpty } from 'class-validator';
import { UserAccount } from './account.interface';

export class CreateAccountDto implements UserAccount {
  @IsNotEmpty()
  id: string;

  @IsNotEmpty()
  alias: string;

  data: any = {};

  @IsNotEmpty()
  website: string;
}
