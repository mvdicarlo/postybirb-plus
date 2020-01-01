import axios, { AxiosInstance } from 'axios';

const instance: AxiosInstance = axios.create({
  baseURL: `https://localhost:${window['PORT']}`
});

export default instance;
