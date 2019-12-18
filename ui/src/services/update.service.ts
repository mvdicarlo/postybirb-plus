import axios from '../utils/http';
import { notification } from 'antd';
import { uiStore } from '../stores/ui.store';

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
        const div = document.createElement('div');
        div.innerHTML = html;
        const status = div.querySelector('[name="updates"]');
        if (status && (status as any).value) {
          const value: string = (status as any).value;
          notification.info({
            message: 'Notice',
            description: value,
            duration: 15,
            prefixCls: `ant-${uiStore.state.theme}-notification`
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
