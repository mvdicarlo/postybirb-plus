import axios from '../utils/http';
import { SubmissionUpdate } from '../../../electron-app/src/submission/interfaces/submission-update.interface';

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
}
