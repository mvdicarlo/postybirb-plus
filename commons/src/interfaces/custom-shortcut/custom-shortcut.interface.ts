import { EntityIntf } from '../database/entity.interface';

export interface CustomShortcut extends EntityIntf {
  shortcut: string;
  content: string;
  isDynamic: boolean;
}
