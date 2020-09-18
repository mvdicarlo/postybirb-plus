import axios from '../utils/http';
import { Settings } from 'postybirb-commons';

export default class SettingsService {
  static getSettings() {
    return axios.get<Settings>('/settings');
  }

  static updateSetting(key: keyof Settings, value: any) {
    axios.patch('/settings/update', { key, value });
  }
}
