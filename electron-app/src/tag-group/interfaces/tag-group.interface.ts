import { EntityIntf } from '../../database/interfaces/entity.interface';

export interface TagGroup extends EntityIntf {
  alias: string;
  tags: string[];
}
