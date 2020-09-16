import PersistedDatabase from 'src/server/database/databases/persisted.database';
import PostyBirbNotificationEntity from './models/postybirb-notification.entity';
import { PostyBirbNotification } from 'postybirb-commons';
import MemoryDatabase from 'src/server/database/databases/memory.database';

export const NotificationRepositoryToken = 'NotificationRepositoryToken';
export type NotificationRepository =
  | PersistedDatabase<PostyBirbNotificationEntity, PostyBirbNotification>
  | MemoryDatabase<PostyBirbNotificationEntity, PostyBirbNotification>;
