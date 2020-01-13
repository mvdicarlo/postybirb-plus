import { Injectable } from '@nestjs/common';
import SubmissionPartEntity from './models/submission-part.entity';
import EntityRepository from 'src/base/entity/entity.repository.base';
import { SubmissionPart } from './interfaces/submission-part.interface';

@Injectable()
export class SubmissionPartRepository extends EntityRepository<
  SubmissionPartEntity<any>,
  SubmissionPart<any>
> {
  constructor() {
    super('submission-part', SubmissionPartEntity);
  }
}
