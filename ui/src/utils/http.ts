import axios, { AxiosInstance } from 'axios';

const instance: AxiosInstance = axios.create({
  baseURL: `http://localhost:${window['PORT']}`
});

export default instance;
