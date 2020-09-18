import socket from '../utils/websocket';
import { observable, computed, action } from 'mobx';
import { PostyBirbNotification } from 'postybirb-commons';
import NotificationService from '../services/notification.service';
import { Events } from 'postybirb-commons';

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

socket.on(Events.NotificationEvent.UPDATE, (notifications: PostyBirbNotification[]) =>
  notificationStore.setNotifications(notifications)
);
