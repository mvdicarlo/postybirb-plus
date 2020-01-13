import { Injectable } from '@nestjs/common';
import { Submission } from './interfaces/submission.interface';
import EntityRepository from 'src/base/entity/entity.repository.base';
import SubmissionEntity from './models/submission.entity';
import FileSubmissionEntity from './file-submission/models/file-submission.entity';

@Injectable()
export class SubmissionRepository extends EntityRepository<SubmissionEntity, Submission> {
  constructor() {
    super('submissions', SubmissionEntity, (entity: any) => {
      if (entity.primary) {
        return FileSubmissionEntity;
      }
      return SubmissionEntity;
    });
  }
}
