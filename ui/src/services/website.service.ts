import axios from '../utils/http';

export default class WebsiteService {
  static getAccountInformation(website: string, id: string) {
    return axios.get(`${website.toLowerCase()}/info/${id}`);
  }
}
