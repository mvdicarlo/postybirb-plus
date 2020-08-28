import { Module, Global } from '@nestjs/common';
import { NotificationController } from './notification.controller';
import { NotificationService } from './notification.service';
import { NotificationRepositoryToken } from './notification.repository';
import { UiNotificationService } from './ui-notification/ui-notification.service';
import { DatabaseFactory } from 'src/server/database/database.factory';
import PostyBirbNotificationEntity from './models/postybirb-notification.entity';
import { SettingsModule } from 'src/server/settings/settings.module';

@Global()
@Module({
  imports: [SettingsModule],
  controllers: [NotificationController],
  providers: [
    NotificationService,
    DatabaseFactory.forProvider(NotificationRepositoryToken, {
      databaseName: 'notification',
      entity: PostyBirbNotificationEntity,
    }),
    UiNotificationService,
  ],
  exports: [NotificationService, UiNotificationService],
})
export class NotificationModule {}
