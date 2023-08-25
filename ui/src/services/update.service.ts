import { notification } from 'antd';
import axios from '../utils/http';

export default class UpdateService {
  static getUpdateData() {
    return axios.get('/update').then(({ data }) => data);
  }

  static doUpdate() {
    return axios.post('/update');
  }

  static checkForUpdates() {
    axios.get('/update/check');
  }

  // NOTE: Not really sure where else to stick this
  static getWebStatus() {
    axios
      .get('http://postybirb.com/version.html')
      .then(res => res.data)
      .then(html => {
        const value = html.match(/name="updates-v3" value="(.*?)"/)[1];
        if (value) {
          // Don't post duplicate messages
          if (localStorage.get('update-notification') !== value) {
            localStorage.set('update-notification', value);
            notification.info({
              message: 'Notice',
              description: value,
              duration: 10,
            });
          }
        }
      })
      .catch(() => {
        /*Swallow*/
      });
  }
}

UpdateService.getWebStatus();
setInterval(() => UpdateService.getWebStatus(), 60000 * 60);
