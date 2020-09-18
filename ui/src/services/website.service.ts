import axios from '../utils/http';
import { UsernameShortcut } from 'postybirb-commons';
import { Folder } from 'postybirb-commons';

export default class WebsiteService {
  static usernameShortcuts: { [key: string]: UsernameShortcut[] } = {};

  static getAccountInformation(website: string, id: string, key: string) {
    return axios.get(`${website.toLowerCase()}/info/${id}?prop=${key}`);
  }

  static getAccountFolders(website: string, id: string) {
    return axios.get<Folder[]>(`${website.toLowerCase()}/folders/${id}`);
  }

  static getUsernameShortcuts() {
    return axios.get('/websites/username-shortcuts').then(({ data }) => data);
  }
}

WebsiteService.getUsernameShortcuts().then(
  shortcuts => (WebsiteService.usernameShortcuts = shortcuts)
);
