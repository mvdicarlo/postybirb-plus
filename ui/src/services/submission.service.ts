import axios from '../utils/http';
import { SubmissionUpdate } from '../../../electron-app/src/submission/interfaces/submission-update.interface';
import { FormSubmissionPart } from '../views/submissions/interfaces/form-submission-part.interface';
import { Problems } from '../../../electron-app/src/submission/validator/interfaces/problems.interface';

export default class SubmissionService {

  static checkProblems(parts: Array<FormSubmissionPart<any>>) {
    return axios.post<Problems>('/submission/dryValidate', parts);
  }

  static deleteFileSubmission(id: string) {
    axios.delete(`/submission/${id}`);
  }

  static duplicate(id: string) {
    return axios.post(`/submission/duplicate/${id}`);
  }

  static getSubmissions(packaged: boolean) {
    return axios.get(`/submission?packaged=${packaged}`);
  }

  static getSubmission(id: string, packaged: boolean) {
    return axios.get(`/submission/${id}?packaged=${packaged}`);
  }

  static removeAdditionalFile(id: string, location: string) {
    return axios.delete(`/submission/remove/additional/${id}/${encodeURIComponent(location)}`);
  }

  static removeThumbnail(id: string) {
    return axios.delete(`/submission/remove/thumbnail/${id}`);
  }

  static setPostAt(id: string, time: number | undefined) {
    return axios.patch(`/submission/set/postAt/${id}`, { time });
  }

  static updateSubmission(submissionPackage: SubmissionUpdate) {
    return axios.post('/submission/update', submissionPackage);
  }
}
