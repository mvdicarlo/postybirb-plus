const { remote } = require('electron');
const PORT = Number(remote.getCurrentWindow().PORT) + 1;
const URL = remote.getCurrentWindow().AUTH_SERVER_URL;

exports.getURL = function(path) {
  return `${URL}/${path}?port=${PORT}`;
};

exports.getPort = function() {
  return PORT;
};

exports.createResponseBody = function(text) {
  return `<div style="
  font-size: 24px;
  color: #1890ff;
  text-align: center;
  margin-top: 5em;
">${text}</div>`;
};
