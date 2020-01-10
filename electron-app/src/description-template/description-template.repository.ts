import { Injectable } from '@nestjs/common';
import DescriptionTemplateEntity from './models/description-template.entity';
import EntityRepository from 'src/base/entity/entity.repository.base';

@Injectable()
export class DescriptionTemplateRepository extends EntityRepository<DescriptionTemplateEntity> {
  constructor() {
    super('description-template', DescriptionTemplateEntity);
  }
}
