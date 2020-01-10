import { Injectable } from '@nestjs/common';
import EntityRepository from 'src/base/entity/entity.repository.base';
import UserAccountEntity from './models/user-account.entity';

@Injectable()
export class AccountRepository extends EntityRepository<UserAccountEntity> {
  constructor() {
    super('accounts', UserAccountEntity);
  }
}
