import axios, { AxiosInstance } from 'axios';

const instance: AxiosInstance = axios.create({
  baseURL: `https://localhost:${window['PORT']}`,
  headers: {
    Authorization: window.AUTH_ID
  }
});

export default instance;
