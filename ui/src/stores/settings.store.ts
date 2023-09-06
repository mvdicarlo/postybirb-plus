import socket from '../utils/websocket';
import { observable, computed, action } from 'mobx';
import { Settings } from 'postybirb-commons';
import SettingsService from '../services/settings.service';
import { Events } from 'postybirb-commons';

export class SettingsStore {
  @observable state: Settings = {
    advertise: true,
    emptyQueueOnFailedPost: true,
    postRetries: 1,
    openOnLogin: false,
    openWindowOnStartup: true,
    useHardwareAcceleration: false,
    maxPNGSizeCompression: 25,
    maxPNGSizeCompressionWithAlpha: 25,
    maxJPEGQualityCompression: 10,
    maxJPEGSizeCompression: 30,
    silentNotification: false,
    defaultTagSearchProvider: 'none',
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

socket.on(Events.SettingEvent.UPDATED, (data: Settings) => {
  settingsStore.updateSettings(data);
});
