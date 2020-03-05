import { Injectable } from '@nestjs/common';
import SubmissionPartEntity from './models/submission-part.entity';
import PersistedDatabase from 'src/database/databases/persisted.database';
import { SubmissionPart } from './interfaces/submission-part.interface';

@Injectable()
export class SubmissionPartRepository extends PersistedDatabase<
  SubmissionPartEntity<any>,
  SubmissionPart<any>
> {
  constructor() {
    super('submission-part', SubmissionPartEntity);
  }
}
