import { Injectable } from '@nestjs/common';
import { SubmissionTemplate } from './interfaces/submission-template.interface';
import PersistedDatabase from 'src/database/databases/persisted.database';
import SubmissionTemplateEntity from './models/submission-template.entity';

@Injectable()
export class SubmissionTemplateRepository extends PersistedDatabase<
  SubmissionTemplateEntity,
  SubmissionTemplate
> {
  constructor() {
    super('submission-templates', SubmissionTemplateEntity);
  }
}
