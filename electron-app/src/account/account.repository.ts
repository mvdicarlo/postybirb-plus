import { Injectable } from '@nestjs/common';
import * as Datastore from 'nedb';
import { DATABASE_DIRECTORY } from 'src/directories';
import * as path from 'path';
import { UserAccount } from './account.interface';
import Repository from 'src/base/repository.base';

@Injectable()
export class AccountRepository extends Repository<UserAccount> {
  constructor() {
    super('accounts');
  }
}
