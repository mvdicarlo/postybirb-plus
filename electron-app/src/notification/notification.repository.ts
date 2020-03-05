import { Injectable } from '@nestjs/common';
import PersistedDatabase from 'src/database/databases/persisted.database';
import PostyBirbNotificationEntity from './models/postybirb-notification.entity';
import { PostyBirbNotification } from './interfaces/postybirb-notification.interface';

@Injectable()
export class NotificationRepository extends PersistedDatabase<
  PostyBirbNotificationEntity,
  PostyBirbNotification
> {
  constructor() {
    super('notification', PostyBirbNotificationEntity);
  }
}
