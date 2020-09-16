import PersistedDatabase from 'src/server/database/databases/persisted.database';
import MemoryDatabase from 'src/server/database/databases/memory.database';
import TagConverterEntity from './models/tag-converter.entity';
import { TagConverter } from 'postybirb-commons';

export const TagConverterRepositoryToken = 'TagConverterRepositoryToken';
export type TagConverterRepository =
  | PersistedDatabase<TagConverterEntity, TagConverter>
  | MemoryDatabase<TagConverterEntity, TagConverter>;
