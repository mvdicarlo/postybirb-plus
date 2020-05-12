import { message, notification } from 'antd';
import { UINotification } from '../../../electron-app/src/notification/interfaces/ui-notification.interface';
import { UINotificationEvent } from '../shared/enums/ui-notification.events.enum';
import socket from '../utils/websocket';

// Deals with displaying system notifications to the UI
export default class UINotificationService {
  static showMessage(msg: UINotification) {
    message[msg.type.toLowerCase()](msg.message, Math.min(2, msg.duration));
  }

  static showNotification(msg: UINotification) {
    notification[msg.type.toLowerCase()]({
      message: msg.title ? msg.title : 'System Notification',
      description: msg.message,
      duration: msg.duration,
    });
  }
}

socket.on(UINotificationEvent.MESSAGE, (data: UINotification) =>
  UINotificationService.showMessage(data)
);

socket.on(UINotificationEvent.NOTIFICATION, (data: UINotification) =>
  UINotificationService.showNotification(data)
);
