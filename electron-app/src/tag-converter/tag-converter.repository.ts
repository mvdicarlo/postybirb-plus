import PersistedDatabase from 'src/database/databases/persisted.database';
import MemoryDatabase from 'src/database/databases/memory.database';
import TagConverterEntity from './models/tag-converter.entity';
import { TagConverter } from './interfaces/tag-converter.interface';


export const TagConverterRepositoryToken = 'TagConverterRepositoryToken';
export type TagConverterRepository =
  | PersistedDatabase<TagConverterEntity, TagConverter>
  | MemoryDatabase<TagConverterEntity, TagConverter>;
