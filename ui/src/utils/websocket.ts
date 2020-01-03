import io from 'socket.io-client';

const socket = io(`https://localhost:${window['PORT']}`, {
  transportOptions: {
    polling: {
      extraHeaders: {
        Authorization: window.AUTH_ID
      }
    }
  }
});
socket.on('connect', () => console.log('Connected'));

export default socket;
