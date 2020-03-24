import PersistedDatabase from 'src/database/databases/persisted.database';
import PostyBirbNotificationEntity from './models/postybirb-notification.entity';
import { PostyBirbNotification } from './interfaces/postybirb-notification.interface';
import MemoryDatabase from 'src/database/databases/memory.database';

export const NotificationRepositoryToken = 'NotificationRepositoryToken';
export type NotificationRepository =
  | PersistedDatabase<PostyBirbNotificationEntity, PostyBirbNotification>
  | MemoryDatabase<PostyBirbNotificationEntity, PostyBirbNotification>;
