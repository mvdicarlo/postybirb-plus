import { EntityIntf } from '../database/entity.interface';

export interface UserAccount extends EntityIntf {
  alias: string;
  data: any;
  website: string;
}
