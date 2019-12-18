import axios from '../utils/http';
import { DescriptionTemplate } from '../../../electron-app/src/description-template/description-template.interface';

export default class DescriptionTemplateService {
  static getAll() {
    return axios.get<DescriptionTemplate[]>('/description-template');
  }

  static remove(id: string) {
    return axios.delete(`/description-template/${id}`);
  }

  static update(template: DescriptionTemplate) {
    return axios.patch('/description-template/update', template);
  }

  static create(template: DescriptionTemplate) {
    return axios.post<DescriptionTemplate>('/description-template/create', template);
  }
}
