const { remote } = require('electron');
const { app } = remote;

window.PORT = remote.getCurrentWindow().PORT;