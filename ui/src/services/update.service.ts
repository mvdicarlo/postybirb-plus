import axios from '../utils/http';

export default class UpdateService {
  static getUpdateData() {
    return axios.get('/update').then(({ data }) => data);
  }

  static doUpdate() {
    return axios.post('/update');
  }
}
