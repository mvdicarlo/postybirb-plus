import { Injectable } from '@nestjs/common';
import * as Datastore from 'nedb';
import { DATABASE_DIRECTORY } from 'src/directories';
import * as path from 'path';
import { FileSubmission } from './file-submission.interface';

@Injectable()
export class FileSubmissionRepository {
  private readonly db = new Datastore({
    filename: path.join(DATABASE_DIRECTORY, 'file-submissions.db'),
    autoload: true,
  });

  create(submission: FileSubmission): Promise<any> {
    return new Promise((resolve, reject) => {
      this.db.insert(submission, (err, doc) => {
        err ? reject(err) : resolve(doc);
        this.db.persistence.compactDatafile();
      });
    });
  }

  find(id: string): Promise<FileSubmission | null> {
    return new Promise(resolve => {
      this.db.findOne({ id }, (err, doc) => {
        resolve(doc);
      });
    });
  }

  findAll(): Promise<FileSubmission[]> {
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

  count(): Promise<number> {
    return new Promise(resolve => {
      this.db.count({}, (err, count: number) => {
        resolve(count || 0);
      });
    });
  }
}
