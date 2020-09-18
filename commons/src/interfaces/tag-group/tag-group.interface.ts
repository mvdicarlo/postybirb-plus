import { EntityIntf } from '../database/entity.interface';

export interface TagGroup extends EntityIntf {
  alias: string;
  tags: string[];
}
