import { Injectable } from '@nestjs/common';
import EntityRepository from 'src/base/entity/entity.repository.base';
import TagGroupEntity from './models/tag-group.entity';

@Injectable()
export class TagGroupRepository extends EntityRepository<TagGroupEntity> {
  constructor() {
    super('tag-group', TagGroupEntity);
  }
}
