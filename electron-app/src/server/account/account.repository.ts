import UserAccountEntity from './models/user-account.entity';
import { UserAccount } from 'postybirb-commons';
import PersistedDatabase from 'src/server/database/databases/persisted.database';
import MemoryDatabase from 'src/server/database/databases/memory.database';

export const AccountRepositoryToken = 'AccountRepositoryToken';
export type AccountRepository =
  | PersistedDatabase<UserAccountEntity, UserAccount>
  | MemoryDatabase<UserAccountEntity, UserAccount>;
