import { EntityIntf } from '../../database/interfaces/entity.interface';

export interface CustomShortcut extends EntityIntf {
  shortcut: string;
  content: string;
  isStatic: boolean;
}
