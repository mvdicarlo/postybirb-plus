import { Injectable } from '@nestjs/common';
import Repository from 'src/base/repository.base';
import { Submission } from './interfaces/submission.interface';

@Injectable()
export class SubmissionRepository extends Repository<Submission> {
  constructor() {
    super('submissions');
  }

  count(): Promise<number> {
    return new Promise(resolve => {
      this.db.count({}, (err, count: number) => {
        resolve(count || 0);
      });
    });
  }
}
