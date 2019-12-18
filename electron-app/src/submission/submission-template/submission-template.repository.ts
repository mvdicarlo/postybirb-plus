import { Injectable } from '@nestjs/common';
import Repository from 'src/base/repository.base';
import { SubmissionTemplate } from './submission-template.interface';

@Injectable()
export class SubmissionTemplateRepository extends Repository<SubmissionTemplate> {
  constructor() {
    super('submission-templates');
  }
}
