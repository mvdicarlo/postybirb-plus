import { Injectable } from '@nestjs/common';
import Repository from '../../base/repository.base';
import { SubmissionLog } from './log.interface';

@Injectable()
export class SubmissionLogRepository extends Repository<SubmissionLog> {
  constructor() {
    super('submission-logs');
  }
}
