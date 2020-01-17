import { EntityIntf } from '../../base/entity/entity.base.interface';

export interface PostyBirbNotification extends EntityIntf {
  type: 'SUCCESS' | 'ERROR' | 'WARNING' | 'INFO';
  title: string;
  body: string;
  viewed?: boolean;
}
