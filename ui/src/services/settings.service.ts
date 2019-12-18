import axios from '../utils/http';
import { Settings } from '../../../electron-app/src/settings/settings.interface';

export default class SettingsService {
  static getSettings() {
    return axios.get<Settings>('/settings');
  }

  static updateSetting(key: keyof Settings, value: any) {
    axios.patch('/settings/update', { key, value });
  }
}
