import { message, notification } from 'antd';
import { UINotification } from 'postybirb-commons';
import { Events } from 'postybirb-commons';
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
      duration: msg.duration
    });
  }
}

socket.on(Events.UINotificationEvent.MESSAGE, (data: UINotification) =>
  UINotificationService.showMessage(data)
);

socket.on(Events.UINotificationEvent.NOTIFICATION, (data: UINotification) =>
  UINotificationService.showNotification(data)
);
