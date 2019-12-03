import axios from '../utils/http';
import { SubmissionUpdate } from '../../../electron-app/src/submission/interfaces/submission-update.interface';
import { FormSubmissionPart } from '../views/submissions/interfaces/form-submission-part.interface';
import { Problems } from '../../../electron-app/src/submission/validator/interfaces/problems.interface';

export default class SubmissionService {

  static checkProblems(parts: Array<FormSubmissionPart<any>>) {
    return axios.post<Problems>('/file_submission/dry_validate', parts);
  }

  static deleteFileSubmission(id: string) {
    axios.delete(`/file_submission/${id}`);
  }

  static duplicate(id: string) {
    return axios.post(`/file_submission/duplicate/${id}`);
  }

  static getFileSubmissionPackage(id: string) {
    return axios.get(`/file_submission/package/${id}`);
  }

  static removeAdditionalFile(id: string, location: string) {
    return axios.delete(`/file_submission/remove/additional/${id}/${encodeURIComponent(location)}`);
  }

  static removeThumbnail(id: string) {
    return axios.delete(`/file_submission/remove/thumbnail/${id}`);
  }

  static setSchedule(id: string, time: number | undefined) {
    return axios.post(`/file_submission/setSchedule/${id}`, { time });
  }

  static updateSubmission(submissionPackage: SubmissionUpdate) {
    return axios.post('/file_submission/update', submissionPackage);
  }
}
