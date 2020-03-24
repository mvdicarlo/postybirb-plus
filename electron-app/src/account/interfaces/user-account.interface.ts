import { EntityIntf } from '../../database/interfaces/entity.interface';

export interface UserAccount extends EntityIntf {
  alias: string;
  data: any;
  website: string;
}
