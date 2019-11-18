import { Injectable } from '@nestjs/common';
import * as Datastore from 'nedb';
import { DATABASE_DIRECTORY } from 'src/directories';
import * as path from 'path';
import { SubmissionPart } from 'src/submission/interfaces/submission-part.interface';

@Injectable()
export class SubmissionPartRepository {
  private readonly db = new Datastore({
    filename: path.join(DATABASE_DIRECTORY, 'submission-part.db'),
    autoload: true,
  });

  create(part: SubmissionPart<any>): Promise<any> {
    return new Promise((resolve, reject) => {
      this.db.insert(part, (err, doc) => {
        err ? reject(err) : resolve(doc);
        this.db.persistence.compactDatafile();
      });
    });
  }

  find(submissionId: string, accountId: string): Promise<SubmissionPart<any> | null> {
    return new Promise(resolve => {
      this.db.findOne({ submissionId, accountId }, (err, doc) => {
        resolve(doc);
      });
    });
  }

  findAllBySubmissionId(submissionId: string): Promise<Array<SubmissionPart<any>>> {
    return new Promise(resolve => {
      this.db.find({ submissionId }, (err, docs) => {
        resolve(docs || []);
      });
    });
  }

  remove(submissionId: string, accountId: string): Promise<number> {
    return new Promise((resolve, reject) => {
      this.db.remove({ submissionId, accountId }, (err, numRemoved) => {
        err ? reject(err) : resolve(numRemoved);
        this.db.persistence.compactDatafile();
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

  update(submissionId: string, accountId, data: any): Promise<void> {
    return new Promise((resolve, reject) => {
      this.db.update({ submissionId, accountId }, { $set: data }, {}, (err, numReplaced) => {
        err ? reject(err) : resolve();
      });
    });
  }
}
