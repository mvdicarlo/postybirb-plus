import { EntityIntf } from '../../base/entity/entity.base.interface';

export interface UserAccount extends EntityIntf {
  alias: string;
  data: any;
  website: string;
}
