import { Injectable } from '@nestjs/common';
import { DescriptionTemplate } from './description-template.interface';
import Repository from '../base/repository.base';

@Injectable()
export class DescriptionTemplateRepository extends Repository<DescriptionTemplate> {
  constructor() {
    super('description-template');
  }
}
