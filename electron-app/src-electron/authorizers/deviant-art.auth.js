const express = require('express');
const { getURL } = require('./common.auth');
const Request = require('request');

const app = express();
let cb;
let server;

exports.getAuthURL = function() {
  return getURL('deviant-art/v1/authorize');
};

exports.start = function(callback) {
  cb = callback;
  if (!server) {
    server = app.listen(4200); // Hard coded 4200 because DA bad >:(
  }
};

exports.stop = function() {
  if (server) {
    server.close();
  }
  cb = null;
  server = null;
};

function getAccessToken(code) {
  Request.post(
    getURL('deviant-art/v1/authorize'),
    {
      json: {
        code,
      },
    },
    (err, res, body) => {
      if (err || (body && !body.success)) {
        cb(null);
      } else {
        const { data } = body;
        data.created = Date.now();
        cb(data);
      }
    },
  );
}

app.get('/deviantart', (req, res) => {
  res.redirect('https://www.deviantart.com');
  getAccessToken(req.query.code);
});
