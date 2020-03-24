import PersistedDatabase from 'src/database/databases/persisted.database';
import MemoryDatabase from 'src/database/databases/memory.database';
import CustomShortcutEntity from './models/custom-shortcut.entity';
import { CustomShortcut } from './interfaces/custom-shortcut.interface';

export const CustomShortcutRepositoryToken = 'CustomShortcutRepositoryToken';
export type CustomShortcutRepository =
  | PersistedDatabase<CustomShortcutEntity, CustomShortcut>
  | MemoryDatabase<CustomShortcutEntity, CustomShortcut>;
