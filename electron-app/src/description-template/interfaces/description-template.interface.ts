import { EntityIntf } from '../../base/entity/entity.base.interface';

export interface DescriptionTemplate extends EntityIntf {
  title: string;
  description?: string;
  content: string;
}
