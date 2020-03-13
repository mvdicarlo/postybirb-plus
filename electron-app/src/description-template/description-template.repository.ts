import DescriptionTemplateEntity from './models/description-template.entity';
import PersistedDatabase from 'src/database/databases/persisted.database';
import { DescriptionTemplate } from './interfaces/description-template.interface';
import MemoryDatabase from 'src/database/databases/memory.database';

export const DescriptionTemplateDatabaseToken = 'DescriptionTemplateDatabaseToken';
export type DescriptionTemplateRepository =
  | PersistedDatabase<DescriptionTemplateEntity, DescriptionTemplate>
  | MemoryDatabase<DescriptionTemplateEntity, DescriptionTemplate>;
