import socket from '../utils/websocket';
import { observable, computed, action } from 'mobx';
import { PostyBirbNotification } from '../../../electron-app/src/server/notification/interfaces/postybirb-notification.interface';
import NotificationService from '../services/notification.service';
import { NotificationEvent } from '../shared/enums/notification.events.enum';

export interface NotificationState {
  notifications: PostyBirbNotification[];
}

export class NotificationStore {
  @observable
  state: NotificationState = {
    notifications: []
  };

  constructor() {
    NotificationService.getAll().then(notifications => (this.state.notifications = notifications));
  }

  @computed
  get notifications(): PostyBirbNotification[] {
    return [...this.state.notifications].sort((a, b) => b.created - a.created);
  }

  @action
  setNotifications(notifications: PostyBirbNotification[]) {
    this.state.notifications = notifications;
  }
}

export const notificationStore = new NotificationStore();

socket.on(NotificationEvent.UPDATE, (notifications: PostyBirbNotification[]) =>
  notificationStore.setNotifications(notifications)
);
