import io from 'socket.io-client';

const socket = io(`http://localhost:${window['PORT']}`);
socket.on('connect', () => console.log('Connected'));

export default socket;
