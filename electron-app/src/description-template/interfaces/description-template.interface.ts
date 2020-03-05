import { EntityIntf } from '../../database/interfaces/entity.interface';

export interface DescriptionTemplate extends EntityIntf {
  title: string;
  description?: string;
  content: string;
}
