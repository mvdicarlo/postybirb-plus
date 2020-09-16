import axios from '../utils/http';
import { CustomShortcut } from 'postybirb-commons';

export default class CustomShortcutService {
  static getAll() {
    return axios.get<CustomShortcut[]>('/custom-shortcut');
  }

  static remove(id: string) {
    return axios.delete(`/custom-shortcut/${id}`);
  }

  static update(template: Partial<CustomShortcut>) {
    return axios.patch('/custom-shortcut/update', template);
  }

  static create(template: Partial<CustomShortcut>) {
    return axios.post<CustomShortcut>('/custom-shortcut/create', template);
  }
}
