import { IsNotEmpty } from 'class-validator';
import { Account } from './account.interface';

export class CreateAccountDto implements Account {
  @IsNotEmpty()
  id: string;

  @IsNotEmpty()
  alias: string;

  data: any;

  @IsNotEmpty()
  website: string;

  toModel(): Account {
    return {
      id: this.id,
      alias: this.alias,
      data: this.data || {},
      website: this.website,
    };
  }
}
