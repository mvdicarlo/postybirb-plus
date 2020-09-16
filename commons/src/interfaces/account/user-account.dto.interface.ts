import { UserAccount } from './user-account.interface';

export interface UserAccountDto extends Omit<UserAccount, 'created' | 'lastUpdated'> {
  loggedIn: boolean;
  username: string;
}
