import axios from '../utils/http';

export default class RemoteService {
  static getAuthId(): string {
    return localStorage.getItem('REMOTE_AUTH') || '';
  }

  static getRemoteURI(): string {
    return localStorage.getItem('REMOTE_URI') || '';
  }

  static isRemote(): boolean {
    return !!localStorage.getItem('REMOTE_URI');
  }

  static async updateCookies(accountId: string) {
    return axios.post('/remote/updateCookies', {
      accountId,
      cookies: await window.electron.session.getCookies(accountId)
    });
  }

  static getFileUrl(url: string): string {
    if (!RemoteService.isRemote()) return url;
    else
      return `${this.getRemoteURI()}/remote/static?uri=${encodeURIComponent(
        url
      )}&auth=${RemoteService.getAuthId()}`;
  }

  static getUrl(url: string): string {
    if (!RemoteService.isRemote()) return `${this.getBaseUrl()}${url}`;
    else return `${this.getRemoteURI()}${url}?auth=${RemoteService.getAuthId()}`;
  }

  static getBaseUrl(): string {
    return axios.defaults.baseURL || '';
  }

  static testConnection() {
    return fetch(`${localStorage.getItem('REMOTE_URI') as string}/remote/ping`, {
      headers: {
        Authorization: localStorage.getItem('REMOTE_AUTH') as string
      }
    }).then(response => {
      return response.ok ? Promise.resolve() : Promise.reject();
    });
  }
}
