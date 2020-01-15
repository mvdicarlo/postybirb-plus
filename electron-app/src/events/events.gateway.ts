import { WebSocketGateway, WebSocketServer, OnGatewayInit } from '@nestjs/websockets';
import { Server } from 'socket.io';
import { classToPlain } from 'class-transformer';
import { Notification, NotificationConstructorOptions } from 'electron';
import { NotificationType } from './enums/notification-type.enum';
import { NotificationEvent } from './enums/notification.event.enum';
import { NotificationInfo } from './interfaces/notification-info.interface';

@WebSocketGateway()
export class EventsGateway implements OnGatewayInit {
  @WebSocketServer()
  server: Server;

  afterInit(server: Server) {
    server.use((socket, next) => {
      if (socket.handshake.headers.authorization === global.AUTH_ID) {
        return next();
      }

      return next(new Error('Authentication Error'));
    });
  }

  public emit(event: string, data: any) {
    this.server.emit(event, classToPlain(data));
  }

  public async emitOnComplete(event: string, promise: Promise<any>) {
    this.server.emit(event, classToPlain(await promise));
  }

  public notify(
    messageOptions: { type: NotificationType; sticky?: boolean; isNotification: boolean, body?: string, title?: string },
    notificationOptions: NotificationConstructorOptions,
  ) {
    if (Notification.isSupported()) {
      const notification = new Notification({
        ...notificationOptions,
        closeButtonText: '',
      });

      notification.on('click', () => global.showApp());

      notification.show();
    }

    const msg: NotificationInfo = {
      type: messageOptions.type,
      sticky: messageOptions.sticky,
      body: messageOptions.body || notificationOptions.body,
      title: messageOptions.isNotification ? messageOptions.title || notificationOptions.title : undefined,
    };
    this.emit(NotificationEvent.NOTIFICATION, msg);
  }
}
