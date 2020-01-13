import { Injectable } from '@nestjs/common';
import { SubmissionTemplate } from './interfaces/submission-template.interface';
import EntityRepository from 'src/base/entity/entity.repository.base';
import SubmissionTemplateEntity from './models/submission-template.entity';

@Injectable()
export class SubmissionTemplateRepository extends EntityRepository<
  SubmissionTemplateEntity,
  SubmissionTemplate
> {
  constructor() {
    super('submission-templates', SubmissionTemplateEntity);
  }
}
