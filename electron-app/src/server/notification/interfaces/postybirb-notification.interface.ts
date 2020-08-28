import { EntityIntf } from '../../database/interfaces/entity.interface';
export type NotificationType = 'SUCCESS' | 'ERROR' | 'WARNING' | 'INFO';

export interface PostyBirbNotification extends EntityIntf {
  type: NotificationType;
  title: string;
  body: string;
  viewed?: boolean;
}
