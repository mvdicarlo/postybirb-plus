import axios, { AxiosInstance } from 'axios';

let remoteURI: string | null = null;
try {
  const storedState = localStorage.getItem('UIState');
  if (storedState) remoteURI = JSON.parse(storedState).remoteURI;
} catch (e) {}

const instance: AxiosInstance = axios.create({
  baseURL: remoteURI || `http://localhost:${window['PORT']}`
});

export default instance;
