import axios from '../utils/http';
import { PostStatuses } from '../../../electron-app/src/submission/post/interfaces/post-status.interface';

export default class PostService {
  static getStatus() {
    return axios.get<PostStatuses>('post/status').then(({ data }) => data);
  }

  static cancel(id: string) {
    return axios.post(`post/cancel/${id}`);
  }

  static queue(id: string) {
    return axios.post(`post/queue/${id}`);
  }
}
