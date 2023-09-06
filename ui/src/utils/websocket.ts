import io from 'socket.io-client';

const socket = io(localStorage.getItem('REMOTE_URI') || `https://localhost:${window['PORT']}`, {
  transportOptions: {
    polling: {
      extraHeaders: {
        Authorization: localStorage.getItem('REMOTE_AUTH') || window.AUTH_ID,
      },
    },
  },
});
socket.on('connect', () => console.log('Connected'));

export default socket;
