import { Injectable } from '@nestjs/common';
import UserAccountEntity from './models/user-account.entity';
import { UserAccount } from './interfaces/user-account.interface';
import PersistedDatabase from 'src/database/databases/persisted.database';

@Injectable()
export class AccountRepository extends PersistedDatabase<UserAccountEntity, UserAccount> {
  constructor() {
    super('accounts', UserAccountEntity);
  }
}
