import { Injectable } from '@nestjs/common';
import * as Datastore from 'nedb';
import { DATABASE_DIRECTORY } from 'src/directories';
import * as path from 'path';
import { SubmissionPart } from 'src/submission/interfaces/submission-part.interface';
import Repository from 'src/base/repository.base';

@Injectable()
export class SubmissionPartRepository extends Repository<SubmissionPart<any>> {
  constructor() {
    super('submission-part');
  }

  findAllBySubmissionId(submissionId: string): Promise<Array<SubmissionPart<any>>> {
    return new Promise(resolve => {
      this.db.find({ submissionId }, (err, docs) => {
        resolve(docs || []);
      });
    });
  }

  removeByAccountId(accountId: string): Promise<number> {
    return new Promise((resolve, reject) => {
      this.db.remove({ accountId }, (err, numRemoved) => {
        err ? reject(err) : resolve(numRemoved);
        this.db.persistence.compactDatafile();
      });
    });
  }

  update(id: string, data: any): Promise<void> {
    return new Promise((resolve, reject) => {
      this.db.update({ id }, { $set: { data } }, {}, (err, numReplaced) => {
        err ? reject(err) : resolve();
      });
    });
  }
}
