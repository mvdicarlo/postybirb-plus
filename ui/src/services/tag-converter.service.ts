import axios from '../utils/http';
import { TagConverter } from '../../../electron-app/src/tag-converter/interfaces/tag-converter.interface';

export default class TagConverterService {
  static getAll() {
    return axios.get<TagConverter[]>('/tag-converter');
  }

  static remove(id: string) {
    return axios.delete(`/tag-converter/${id}`);
  }

  static update(template: Partial<TagConverter>) {
    return axios.patch('/tag-converter/update', template);
  }

  static create(template: Partial<TagConverter>) {
    return axios.post<TagConverter>('/tag-converter/create', template);
  }
}
