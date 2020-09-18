import DescriptionTemplateEntity from './models/description-template.entity';
import PersistedDatabase from 'src/server/database/databases/persisted.database';
import { DescriptionTemplate } from 'postybirb-commons';
import MemoryDatabase from 'src/server/database/databases/memory.database';

export const DescriptionTemplateRepositoryToken = 'DescriptionTemplateRepositoryToken';
export type DescriptionTemplateRepository =
  | PersistedDatabase<DescriptionTemplateEntity, DescriptionTemplate>
  | MemoryDatabase<DescriptionTemplateEntity, DescriptionTemplate>;
