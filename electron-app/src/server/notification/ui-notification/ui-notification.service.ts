import { Injectable } from '@nestjs/common';
import { EventsGateway } from 'src/server/events/events.gateway';
import { NotificationType } from '../enums/notification-type.enum';
import { Events } from 'postybirb-commons';
import { UINotification } from '../interfaces/ui-notification.interface';

@Injectable()
export class UiNotificationService {
  constructor(private readonly eventEmitter: EventsGateway) {}

  createUIMessage(type: NotificationType, duration: number, message: string) {
    const event: UINotification = {
      type,
      duration,
      message,
    };
    this.eventEmitter.emit(Events.UINotificationEvent.MESSAGE, event);
  }

  createUINotification(
    type: NotificationType,
    duration: number, // In Seconds
    message: string,
    title?: string,
  ) {
    const event: UINotification = {
      type,
      duration,
      message,
      title,
    };
    this.eventEmitter.emit(Events.UINotificationEvent.NOTIFICATION, event);
  }
}
