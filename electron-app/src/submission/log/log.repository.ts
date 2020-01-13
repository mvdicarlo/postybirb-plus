import { Injectable } from '@nestjs/common';
import { SubmissionLog } from './interfaces/submission-log.interface';
import EntityRepository from 'src/base/entity/entity.repository.base';
import SubmissionLogEntity from './models/submission-log.entity';

@Injectable()
export class SubmissionLogRepository extends EntityRepository<SubmissionLogEntity, SubmissionLog> {
  constructor() {
    super('submission-logs', SubmissionLogEntity);
  }
}
