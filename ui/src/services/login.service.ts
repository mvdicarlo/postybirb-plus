import axios from '../utils/http';
import { UserAccountDto } from '../../../electron-app/src/account/interfaces/user-account.dto.interface';

export default class LoginService {
  static checkLogin(id: string) {
    return axios.get<UserAccountDto>(`/account/check/${id}`);
  }

  static createAccount(id: string, website: string, alias: string, data?: any) {
    return axios.post('/account/create', {
      _id: id,
      website,
      alias,
      data
    });
  }

  static deleteAccount(id: string) {
    if (localStorage.getItem('REMOTE_URI')) {
      window.electron.session.clearSessionData(id);
    }
    return axios.delete(`/account/${id}`);
  }

  static getStatuses() {
    return axios.get('/account/statuses').then(({ data }) => data);
  }

  static setAccountData(id: string, data: any) {
    return axios.patch(`/account/data/${id}`, { data });
  }

}
