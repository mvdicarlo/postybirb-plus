import socket from '../utils/websocket';
import { observable, computed, action } from 'mobx';
import { Settings } from '../../../electron-app/src/settings/settings.interface';
import SettingsService from '../services/settings.service';
import { SettingEvent } from '../shared/enums/settings.events.enum';

export class SettingsStore {
  @observable state: Settings = {
    advertise: true,
    emptyQueueOnFailedPost: true,
    postInterval: 0,
    postRetries: 1,
    openOnStartup: true,
    useHardwareAcceleration: false
  };

  constructor() {
    SettingsService.getSettings().then(({ data }) => {
      Object.assign(this.state, data);
    });
  }

  @computed
  get settings(): Settings {
    return Object.assign({}, this.state);
  }

  @action
  updateSettings(settings: Settings) {
    Object.assign(this.state, settings);
  }
}

export const settingsStore = new SettingsStore();

socket.on(SettingEvent.UPDATED, (data: Settings) => {
  settingsStore.updateSettings(data);
});
