import axios from '../utils/http';

export default class RemoteService {
  static isRemote(): boolean {
    return !!localStorage.getItem('REMOTE_URI');
  }

  static async updateCookies(accountId: string) {
    return axios.post('/remote/updateCookies', {
      accountId,
      cookies: await window.electron.session.getCookies(accountId)
    });
  }
}
