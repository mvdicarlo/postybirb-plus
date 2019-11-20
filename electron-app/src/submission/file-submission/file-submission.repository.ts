import { Injectable } from '@nestjs/common';
import { FileSubmission } from './interfaces/file-submission.interface';
import Repository from 'src/base/repository.base';

@Injectable()
export class FileSubmissionRepository extends Repository<FileSubmission> {
  constructor() {
    super('file-submissions');
  }

  count(): Promise<number> {
    return new Promise(resolve => {
      this.db.count({}, (err, count: number) => {
        resolve(count || 0);
      });
    });
  }
}
