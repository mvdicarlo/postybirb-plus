import PersistedDatabase from 'src/server/database/databases/persisted.database';
import MemoryDatabase from 'src/server/database/databases/memory.database';
import CustomShortcutEntity from './models/custom-shortcut.entity';
import { CustomShortcut } from 'postybirb-commons';

export const CustomShortcutRepositoryToken = 'CustomShortcutRepositoryToken';
export type CustomShortcutRepository =
  | PersistedDatabase<CustomShortcutEntity, CustomShortcut>
  | MemoryDatabase<CustomShortcutEntity, CustomShortcut>;
