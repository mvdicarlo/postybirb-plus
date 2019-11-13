import { Injectable } from '@nestjs/common';
import * as Datastore from 'nedb';
import { DATABASE_DIRECTORY } from 'src/directories';
import * as path from 'path';
import { UserAccount } from './account.interface';

@Injectable()
export class AccountRepository {
  private readonly db = new Datastore({
    filename: path.join(DATABASE_DIRECTORY, 'accounts.db'),
    autoload: true,
  });

  create(account: UserAccount): Promise<any> {
    return new Promise((resolve, reject) => {
      this.db.insert(account, (err, doc) => {
        err ? reject(err) : resolve(doc);
        this.db.persistence.compactDatafile();
      });
    });
  }

  find(id: string): Promise<UserAccount | null> {
    return new Promise(resolve => {
      this.db.findOne({ id }, (err, doc) => {
        resolve(doc);
      });
    });
  }

  findAll(): Promise<UserAccount[]> {
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

  update(id: string, fields: any): Promise<void> {
    return new Promise((resolve, reject) => {
      this.db.update({ id }, { $set: fields }, {}, (err, numReplaced) => {
        err ? reject(err) : resolve();
      });
    });
  }
}
