import { Injectable } from '@nestjs/common';
import DescriptionTemplateEntity from './models/description-template.entity';
import EntityRepository from 'src/base/entity/entity.repository.base';
import { DescriptionTemplate } from './interfaces/description-template.interface';

@Injectable()
export class DescriptionTemplateRepository extends EntityRepository<
  DescriptionTemplateEntity,
  DescriptionTemplate
> {
  constructor() {
    super('description-template', DescriptionTemplateEntity);
  }
}
