import io from 'socket.io-client';

const socket = io(`https://localhost:${window['PORT']}`);
socket.on('connect', () => console.log('Connected'));

export default socket;
