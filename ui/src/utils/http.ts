import axios, { AxiosInstance } from 'axios';

const instance: AxiosInstance = axios.create({
  baseURL: localStorage.getItem('REMOTE_URI') || `https://localhost:${window['PORT']}`,
  headers: {
    Authorization: localStorage.getItem('REMOTE_AUTH') || window.AUTH_ID
  }
});

export default instance;
