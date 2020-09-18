import { FileRecord } from 'postybirb-commons';
import { SubmissionCreate } from 'postybirb-commons';
import { SubmissionOverwrite } from 'postybirb-commons';
import { SubmissionPackage } from 'postybirb-commons';
import { SubmissionUpdate } from 'postybirb-commons';
import { SubmissionLog } from 'postybirb-commons';
import { Problems } from 'postybirb-commons';
import axios from '../utils/http';
import { FormSubmissionPart } from '../views/submissions/submission-forms/interfaces/form-submission-part.interface';

export default class SubmissionService {
  static checkProblems(id: string, parts: Array<FormSubmissionPart<any>>) {
    return axios.post<Problems>('/submission/dryValidate', { id, parts });
  }

  static create(create: SubmissionCreate) {
    const data = new FormData();
    Object.entries(create).forEach(([key, value]) => {
      if (value) {
        data.set(key, value);
      }
    });
    return axios.post('/submission/create', data);
  }

  static createFromClipboard() {
    const formData: FormData = new FormData();
    formData.set('file', window.electron.clipboard.read());
    return axios.post('/submission/create/', formData);
  }

  static changeFallback(id: string, file: File) {
    const formData = new FormData();
    formData.set('file', file);
    return axios
      .post<SubmissionPackage<any>>(`/submission/change/fallback/${id}`, formData)
      .then(({ data }) => data);
  }

  static deleteSubmission(id: string) {
    return axios.delete(`/submission/${id}`);
  }

  static duplicate(id: string) {
    return axios.post(`/submission/duplicate/${id}`);
  }

  static getFallbackText(id: string) {
    return axios.get<string>(`/submission/fallback/${id}`).then(({ data }) => data);
  }

  static getSubmissions(packaged: boolean) {
    return axios.get(`/submission?packaged=${packaged}`);
  }

  static getSubmission(id: string, packaged: boolean) {
    return axios.get(`/submission/${id}?packaged=${packaged}`);
  }

  static overwriteSubmissionParts(overwrite: SubmissionOverwrite) {
    return axios.post('/submission/overwrite', overwrite);
  }

  static recreateSubmissionFromLog(log: SubmissionLog) {
    return axios.post('/submission/recreate', log);
  }

  static removeAdditionalFile(id: string, location: string) {
    return axios.delete(`/submission/remove/additional/${id}/${encodeURIComponent(location)}`);
  }

  static removeThumbnail(id: string) {
    return axios.delete(`/submission/remove/thumbnail/${id}`);
  }

  static schedule(id: string, isScheduled: boolean, postAt?: number) {
    return axios.post(`/submission/schedule/${id}`, { isScheduled, postAt });
  }

  static changeOrder(id: string, to: number, from: number) {
    return axios.post('/submission/changeOrder', { id, to, from });
  }

  static setPostAt(id: string, postAt: number | undefined) {
    return axios.patch(`/submission/set/postAt/${id}`, { postAt });
  }

  static splitAdditionalFilesIntoNewSubmissions(id: string) {
    return axios.post(`/submission/splitAdditional/${id}`);
  }

  static updateAdditionalFileIgnoredAccounts(id: string, record: FileRecord) {
    return axios.patch(`/submission/update/additional/${id}`, record);
  }

  static updateSubmission(submissionPackage: SubmissionUpdate) {
    return axios.patch('/submission/update', submissionPackage);
  }
}
