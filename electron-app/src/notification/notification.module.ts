import { Module, Global } from '@nestjs/common';
import { NotificationController } from './notification.controller';
import { NotificationService } from './notification.service';
import { NotificationRepository } from './notification.repository';
import { UiNotificationService } from './ui-notification/ui-notification.service';

@Global()
@Module({
  controllers: [NotificationController],
  providers: [NotificationService, NotificationRepository, UiNotificationService],
  exports: [NotificationService, UiNotificationService],
})
export class NotificationModule {}
