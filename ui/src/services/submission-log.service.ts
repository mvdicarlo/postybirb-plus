import axios from '../utils/http';
import { SubmissionType } from 'postybirb-commons';
import { SubmissionLog } from 'postybirb-commons';

export default class SubmissionLogService {
  static getLogs(type: SubmissionType) {
    return axios.get<SubmissionLog[]>(`/submission-log/${type}`).then(({ data }) => data);
  }
}
