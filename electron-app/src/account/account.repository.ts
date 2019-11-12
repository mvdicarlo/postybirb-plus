import { Injectable } from '@nestjs/common';
import * as Datastore from 'nedb';
import { DATABASE_DIRECTORY } from 'src/directories';
import * as path from 'path';
import { Account } from './account.interface';


@Injectable()
export class AccountRepository {
  private readonly db = new Datastore({
    filename: path.join(DATABASE_DIRECTORY, 'accounts.db'),
    autoload: true,
  });

  create(account: Account): Promise<any> {
    return new Promise((resolve, reject) => {
      this.db.insert(account, (err, doc) => {
        err ? reject(err) : resolve(doc);
        this.db.persistence.compactDatafile();
      });
    });
  }

  find(id: string): Promise<Account | null> {
    return new Promise(resolve => {
      this.db.findOne({ id }, (err, doc) => {
        resolve(doc);
      });
    });
  }

  findAll(): Promise<Account[]> {
    return new Promise(resolve => {
      this.db.find({}, (err, docs) => {
        resolve(docs || []);
      });
    });
  }

  remove(id: string): Promise<number> {
    return new Promise((resolve, reject) => {
      this.db.remove({ id }, (err, numRemoved) => {
        err ? reject(err) : resolve(numRemoved);
        this.db.persistence.compactDatafile();
      });
    });
  }
}
