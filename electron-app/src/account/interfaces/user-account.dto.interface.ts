import { UserAccount } from './user-account.interface';

export interface UserAccountDto extends Omit<UserAccount, '_id' | 'created' | 'lastUpdated'> {
  loggedIn: boolean;
  username: string;
}
