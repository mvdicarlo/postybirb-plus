import axios from '../utils/http';
import { Settings } from '../../../electron-app/src/settings/interfaces/settings.interface';

export default class SettingsService {
  static getSettings() {
    return axios.get<Settings>('/settings');
  }

  static updateSetting(key: keyof Settings, value: any) {
    axios.post('/settings', { key, value });
  }
}
