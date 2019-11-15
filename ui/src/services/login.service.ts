import axios from '../utils/http';
import { UserAccountDto } from '../../../electron-app/src/account/account.interface';

export default class LoginService {
  static createAccount(
    id: string,
    website: string,
    alias: string,
    data?: any
  ): Promise<any> {
    return axios.post('/account/create', {
      id,
      website,
      alias,
      data
    });
  }

  static deleteAccount(id: string): Promise<any> {
    return axios.delete(`/account/${id}`);
  }

  static checkLogin(id: string): Promise<UserAccountDto> {
    return axios.get(`/account/checkLogin/${id}`);
  }
}
