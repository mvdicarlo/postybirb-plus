import PersistedDatabase from 'src/server/database/databases/persisted.database';
import TagGroupEntity from './models/tag-group.entity';
import { TagGroup } from 'postybirb-commons';
import MemoryDatabase from 'src/server/database/databases/memory.database';

export const TagGroupRepositoryToken = 'TagGroupRepositoryToken';
export type TagGroupRepository =
  | PersistedDatabase<TagGroupEntity, TagGroup>
  | MemoryDatabase<TagGroupEntity, TagGroup>;
