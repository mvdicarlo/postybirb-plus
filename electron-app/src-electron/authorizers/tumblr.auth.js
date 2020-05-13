const express = require('express');
const { getURL, getPort, createResponseBody } = require('./common.auth');
const Request = require('request');

const app = express();
let cb;
let server;
let tmp;

exports.getAuthURL = function() {
  return `http://localhost:${getPort()}/tumblr/auth`;
};

exports.start = function(callback) {
  cb = callback;
  if (!server) {
    server = app.listen(getPort());
  }
};

exports.stop = function() {
  if (server) {
    server.close();
  }
  cb = null;
  server = null;
};

app.get('/tumblr/auth', (req, res) => {
  Request.get(getURL('tumblr/v1/authorize'), { json: true }, (err, response, body) => {
    if (err) {
      res.redirect(`http://localhost:${getPort()}/tumblr`);
    } else {
      console.log(body);
      tmp = body.data;
      res.redirect(tmp.url);
    }
  });
});

app.get('/tumblr', (req, res) => {
  Request.post(
    getURL('tumblr/v1/authorize'),
    {
      json: {
        token: req.query.oauth_token,
        secret: tmp.secret,
        verifier: req.query.oauth_verifier,
      },
    },
    (err, response, body) => {
      tmp = null;
      if (err || !body.success) {
        res.send(createResponseBody('Error occurred while trying to authenticate.'));
      } else {
        if (cb) {
          cb(body.data);
        }
        res.send(createResponseBody('Tumblr successfully authenticated!'));
      }
    },
  );
});
