import axios from '../utils/http';
import { SubmissionType } from 'postybirb-commons';
import { SubmissionTemplate } from '../../../electron-app/src/server/submission/submission-template/interfaces/submission-template.interface';
import { SubmissionTemplateUpdateDto } from '../../../electron-app/src/server/submission/submission-template/interfaces/submission-template-update.interface';

export default class SubmissionTemplateService {
  static createTemplate(alias: string, type: SubmissionType) {
    return axios.post('./submission-template/create', { alias, type });
  }

  static getTemplate(id: string): Promise<SubmissionTemplate> {
    return axios.get(`/submission-template/${id}`).then(({ data }) => data);
  }

  static getTemplates(): Promise<SubmissionTemplate[]> {
    return axios.get('/submission-template').then(({ data }) => data);
  }

  static removeTemplate(id: string) {
    return axios.delete(`/submission-template/${id}`);
  }

  static renameTemplate(id: string, alias: string) {
    return axios.patch(`/submission-template/rename`, { id, alias });
  }

  static updateTemplate(updateDto: SubmissionTemplateUpdateDto): Promise<SubmissionTemplate> {
    return axios.patch('/submission-template/update', updateDto).then(({ data }) => data);
  }
}
