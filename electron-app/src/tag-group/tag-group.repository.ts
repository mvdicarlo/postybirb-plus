import { Injectable } from '@nestjs/common';
import PersistedDatabase from 'src/database/databases/persisted.database';
import TagGroupEntity from './models/tag-group.entity';
import { TagGroup } from './interfaces/tag-group.interface';

@Injectable()
export class TagGroupRepository extends PersistedDatabase<TagGroupEntity, TagGroup> {
  constructor() {
    super('tag-group', TagGroupEntity);
  }
}
