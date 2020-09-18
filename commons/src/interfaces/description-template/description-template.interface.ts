import { EntityIntf } from '../database/entity.interface';

export interface DescriptionTemplate extends EntityIntf {
  title: string;
  description?: string;
  content: string;
}
