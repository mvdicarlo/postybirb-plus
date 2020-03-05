import { Injectable } from '@nestjs/common';
import { SubmissionLog } from './interfaces/submission-log.interface';
import PersistedDatabase from 'src/database/databases/persisted.database';
import SubmissionLogEntity from './models/submission-log.entity';

@Injectable()
export class SubmissionLogRepository extends PersistedDatabase<SubmissionLogEntity, SubmissionLog> {
  constructor() {
    super('submission-logs', SubmissionLogEntity);
  }
}
