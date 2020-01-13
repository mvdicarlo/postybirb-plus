import { Injectable } from '@nestjs/common';
import EntityRepository from 'src/base/entity/entity.repository.base';
import TagGroupEntity from './models/tag-group.entity';
import { TagGroup } from './interfaces/tag-group.interface';

@Injectable()
export class TagGroupRepository extends EntityRepository<TagGroupEntity, TagGroup> {
  constructor() {
    super('tag-group', TagGroupEntity);
  }
}
