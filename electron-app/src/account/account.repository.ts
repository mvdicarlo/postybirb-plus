import { Injectable } from '@nestjs/common';
import { UserAccount } from './account.interface';
import Repository from 'src/base/repository.base';

@Injectable()
export class AccountRepository extends Repository<UserAccount> {
  constructor() {
    super('accounts');
  }
}
