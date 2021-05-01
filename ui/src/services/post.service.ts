import axios from '../utils/http';
import { PostStatuses } from 'postybirb-commons';
import { SubmissionType } from 'postybirb-commons';

export default class PostService {
  static cancel(id: string) {
    return axios.post(`post/cancel/${id}`);
  }

  static cancelAll(type: SubmissionType) {
    return axios.post(`post/clearQueue/${type}`);
  }

  static getStatus() {
    return axios.get<PostStatuses>('post/status').then(({ data }) => data);
  }

  static queue(id: string) {
    return axios.post(`post/queue/${id}`);
  }
}
