import { notification } from 'antd';
import axios from '../utils/http';

export default class UpdateService {
  static getUpdateData() {
    return axios.get('/update').then(({ data }) => data);
  }

  static doUpdate() {
    return axios.post('/update');
  }

  // NOTE: Not really sure where else to stick this
  static getWebStatus() {
    axios
      .get('http://postybirb.com/version.html')
      .then(res => res.data)
      .then(html => {
        const value = html.match(/name="updates" value="(.*?)"/)[1];
        if (value) {
          notification.info({
            message: 'Notice',
            description: value,
            duration: 10,
          });
        }
      })
      .catch(() => {
        /*Swallow*/
      });
  }
}

UpdateService.getWebStatus();
setInterval(() => UpdateService.getWebStatus(), 60000 * 60);
