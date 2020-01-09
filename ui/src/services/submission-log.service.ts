import axios from '../utils/http';
import { SubmissionType } from '../shared/enums/submission-type.enum';
import { SubmissionLog } from '../../../electron-app/src/submission/log/log.interface';

export default class SubmissionLogService {
  static getLogs(type: SubmissionType) {
    return axios.get<SubmissionLog[]>(`/submission-log/${type}`).then(({ data }) => data);
  }
}
