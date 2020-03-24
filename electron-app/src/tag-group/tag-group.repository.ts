import PersistedDatabase from 'src/database/databases/persisted.database';
import TagGroupEntity from './models/tag-group.entity';
import { TagGroup } from './interfaces/tag-group.interface';
import MemoryDatabase from 'src/database/databases/memory.database';

export const TagGroupRepositoryToken = 'TagGroupRepositoryToken';
export type TagGroupRepository =
  | PersistedDatabase<TagGroupEntity, TagGroup>
  | MemoryDatabase<TagGroupEntity, TagGroup>;
