import UserAccountEntity from './models/user-account.entity';
import { UserAccount } from './interfaces/user-account.interface';
import PersistedDatabase from 'src/database/databases/persisted.database';
import MemoryDatabase from 'src/database/databases/memory.database';

export const AccountRepositoryToken = 'AccountRepositoryToken';
export type AccountRepository =
  | PersistedDatabase<UserAccountEntity, UserAccount>
  | MemoryDatabase<UserAccountEntity, UserAccount>;
