import axios from '../utils/http';
import { PostStatuses } from '../../../electron-app/src/server/submission/post/interfaces/post-status.interface';
import { SubmissionType } from '../../../electron-app/src/server/submission/enums/submission-type.enum';

export default class PostService {
  static cancel(id: string) {
    return axios.post(`post/cancel/${id}`);
  }

  static cancelAll(type: SubmissionType) {
    return axios.post(`post/cancellAll/${type}`);
  }

  static getStatus() {
    return axios.get<PostStatuses>('post/status').then(({ data }) => data);
  }

  static queue(id: string) {
    return axios.post(`post/queue/${id}`);
  }
}
