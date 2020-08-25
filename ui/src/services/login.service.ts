import axios from '../utils/http';
import { UserAccountDto } from '../../../electron-app/src/server/account/interfaces/user-account.dto.interface';
import RemoteService from './remote.service';

export default class LoginService {
  static checkLogin(id: string) {
    return axios.get<UserAccountDto>(`/account/check/${id}`);
  }

  static clearAccountData(id: string) {
    window.electron.session.clearSessionData(id);
    return axios.post(`/account/clear/${id}`);
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
    if (RemoteService.isRemote()) {
      window.electron.session.clearSessionData(id);
    }
    return axios.delete(`/account/${id}`);
  }

  static getStatuses() {
    return axios.get('/account/statuses').then(({ data }) => data);
  }

  static renameAccount(id: string, alias: string) {
    return axios.patch('/account/rename', { id, alias });
  }

  static setAccountData(id: string, data: any) {
    return axios.patch(`/account/data/${id}`, { data });
  }
}
