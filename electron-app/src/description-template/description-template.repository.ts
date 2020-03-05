import { Injectable } from '@nestjs/common';
import DescriptionTemplateEntity from './models/description-template.entity';
import PersistedDatabase from 'src/database/databases/persisted.database';
import { DescriptionTemplate } from './interfaces/description-template.interface';

@Injectable()
export class DescriptionTemplateRepository extends PersistedDatabase<
  DescriptionTemplateEntity,
  DescriptionTemplate
> {
  constructor() {
    super('description-template', DescriptionTemplateEntity);
  }
}
