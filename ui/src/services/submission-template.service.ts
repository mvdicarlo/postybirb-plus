import axios from '../utils/http';
import { SubmissionType } from '../shared/enums/submission-type.enum';

export default class SubmissionTemplateService {
  static createTemplate(alias: string, type: SubmissionType) {
    return axios.post('./submission-template/create', { alias, type });
  }

  static getTemplates() {
    return axios.get('/submission-template').then(({ data }) => data);
  }

  static removeTemplate(id: string) {
    return axios.delete(`/submission-template/${id}`);
  }

  static renameTemplate(id: string, alias: string) {
    return axios.patch(`/submission-template/rename`, { id, alias });
  }
}
