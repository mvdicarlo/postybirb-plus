import axios from '../utils/http';
import { UserAccountDto } from '../../../electron-app/src/account/account.interface';

export default class LoginService {
  static checkLogin(id: string) {
    return axios.get<UserAccountDto>(`/account/checkLogin/${id}`);
  }

  static createAccount(id: string, website: string, alias: string, data?: any) {
    return axios.post('/account/create', {
      id,
      website,
      alias,
      data
    });
  }

  static deleteAccount(id: string) {
    return axios.delete(`/account/${id}`);
  }

  static setAccountData(id: string, data: any) {
    return axios.patch(`/account/data/${id}`, { data });
  }
}
