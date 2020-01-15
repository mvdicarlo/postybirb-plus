import socket from '../utils/websocket';
import { NotificationInfo } from '../../../electron-app/src/events/interfaces/notification-info.interface';
import { message, notification } from 'antd';
import { uiStore } from '../stores/ui.store';
import React from 'react';

/*
 * Service just for the purpose of listening to app notifications.
 */

enum NotificationEvent {
  NOTIFICATION = '[NOTIFICATION]'
}

socket.on(NotificationEvent.NOTIFICATION, (info: NotificationInfo) => {
  if (info.title) {
    // Notification
    let msgFn = notification.info;
    switch (info.type) {
      case 'ERROR':
        msgFn = notification.error;
        break;
      case 'WARNING':
        msgFn = notification.warning;
        break;
      case 'INFO':
        msgFn = notification.info;
        break;
      case 'SUCCESS':
        msgFn = notification.success;
        break;
    }

    msgFn({
      description: <div style={{ whiteSpace: 'pre-line' }}>{info.body}</div>,
      message: info.title,
      duration: info.sticky ? 0 : undefined,
      prefixCls: `ant-${uiStore.state.theme}-notification`
    });
  } else {
    // Message
    let msgFn = message.info;
    switch (info.type) {
      case 'ERROR':
        msgFn = message.error;
        break;
      case 'WARNING':
        msgFn = message.warning;
        break;
      case 'INFO':
        msgFn = message.info;
        break;
      case 'SUCCESS':
        msgFn = message.success;
        break;
    }
    msgFn(info.body, info.sticky ? 0 : undefined);
  }
});
