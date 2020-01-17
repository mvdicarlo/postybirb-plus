import { Injectable } from '@nestjs/common';
import EntityRepository from 'src/base/entity/entity.repository.base';
import PostyBirbNotificationEntity from './models/postybirb-notification.entity';
import { PostyBirbNotification } from './interfaces/postybirb-notification.interface';

@Injectable()
export class NotificationRepository extends EntityRepository<
  PostyBirbNotificationEntity,
  PostyBirbNotification
> {
  constructor() {
    super('notification', PostyBirbNotificationEntity);
  }
}
