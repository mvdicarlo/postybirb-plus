import { Injectable } from '@nestjs/common';
import EntityRepository from 'src/base/entity/entity.repository.base';
import UserAccountEntity from './models/user-account.entity';
import { UserAccount } from './interfaces/user-account.interface';

@Injectable()
export class AccountRepository extends EntityRepository<UserAccountEntity, UserAccount> {
  constructor() {
    super('accounts', UserAccountEntity);
  }
}
