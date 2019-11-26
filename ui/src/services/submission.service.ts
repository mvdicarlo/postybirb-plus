import axios from '../utils/http';
import { SubmissionUpdate } from '../../../electron-app/src/submission/interfaces/submission-update.interface';
import { FormSubmissionPart } from '../views/submissions/interfaces/form-submission-part.interface';
import { Problems } from '../../../electron-app/src/submission/validator/interfaces/problems.interface';

export default class SubmissionService {
  static deleteFileSubmission(id: string) {
    axios.delete(`/file_submission/${id}`);
  }

  static getFileSubmissionPackage(id: string) {
    return axios.get(`/file_submission/package/${id}`);
  }

  static updateSubmission(submissionPackage: SubmissionUpdate) {
    return axios.post('/file_submission/update', submissionPackage);
  }

  static duplicate(id: string) {
    return axios.post(`/file_submission/duplicate/${id}`);
  }

  static checkProblems(parts: Array<FormSubmissionPart<any>>) {
    return axios.post<Problems>('/file_submission/dry_validate', parts);
  }
}
