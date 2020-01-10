import { EntityIntf } from '../../base/entity/entity.base.interface';

export interface TagGroup extends EntityIntf {
  alias: string;
  tags: string[];
}
