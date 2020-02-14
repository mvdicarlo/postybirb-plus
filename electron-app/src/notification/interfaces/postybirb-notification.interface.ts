import { EntityIntf } from '../../base/entity/entity.base.interface';
export type NotificationType = 'SUCCESS' | 'ERROR' | 'WARNING' | 'INFO';

export interface PostyBirbNotification extends EntityIntf {
  type: NotificationType;
  title: string;
  body: string;
  viewed?: boolean;
}
