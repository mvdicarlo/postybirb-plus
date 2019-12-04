import { DATABASE_DIRECTORY } from 'src/directories';
import * as path from 'path';
import * as Datastore from 'nedb';

export default class Repository<T> {
  protected readonly db: Datastore;

  constructor(databaseName: string) {
    this.db = new Datastore({
      filename: path.join(DATABASE_DIRECTORY, `${databaseName}.db`),
      autoload: true,
    });
  }

  create(newItem: T): Promise<T> {
    return new Promise((resolve, reject) => {
      this.db.insert(newItem, (err, doc) => {
        err ? reject(err) : resolve(doc);
        this.db.persistence.compactDatafile();
      });
    });
  }

  find(id: string): Promise<T | null> {
    return new Promise(resolve => {
      this.db.findOne({ id }, (err: any, doc: T) => {
        resolve(doc);
      });
    });
  }

  findAll(search?: any): Promise<T[]> {
    return new Promise(resolve => {
      this.db.find({ ...search }, (err: any, docs: T[]) => {
        resolve(docs || []);
      });
    });
  }

  remove(id: string): Promise<number> {
    return new Promise((resolve, reject) => {
      this.db.remove({ id }, (err: any, numRemoved: number) => {
        err ? reject(err) : resolve(numRemoved);
        this.db.persistence.compactDatafile();
      });
    });
  }

  removeBy(search: any): Promise<number> {
    return new Promise((resolve, reject) => {
      this.db.remove(search, (err: any, numRemoved: number) => {
        err ? reject(err) : resolve(numRemoved);
        this.db.persistence.compactDatafile();
      });
    });
  }

  update(id: string, fields: any): Promise<void> {
    return new Promise((resolve, reject) => {
      this.db.update({ id }, { $set: fields }, {}, (err: any, numReplaced: number) => {
        err ? reject(err) : resolve();
      });
    });
  }
}
