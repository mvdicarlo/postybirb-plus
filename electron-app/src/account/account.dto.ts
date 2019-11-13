import { IsNotEmpty } from 'class-validator';
import { UserAccount } from './account.interface';

export class CreateAccountDto implements UserAccount {
  @IsNotEmpty()
  id: string;

  @IsNotEmpty()
  alias: string;

  data: any;

  @IsNotEmpty()
  website: string;

  toModel(): UserAccount {
    return {
      id: this.id,
      alias: this.alias,
      data: this.data || {},
      website: this.website,
    };
  }
}
