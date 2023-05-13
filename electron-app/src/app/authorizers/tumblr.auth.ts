import express from 'express';
import { getURL, getPort, createResponseBody } from './common.auth';
import Request from 'request';
import { Server } from 'http';

const app = express();
let cb: (data: any) => any;
let server: Server;
let tmp: any;

export function getAuthURL() {
  return `http://localhost:${getPort()}/tumblr/auth`;
}

export function start(callback: (data: any) => any) {
  cb = callback;
  if (!server) {
    server = app.listen(getPort());
  }
}

export function stop() {
  if (server) {
    server.close();
  }
  cb = null;
  server = null;
}

app.get('/tumblr/auth', (req, res) => {
  Request.get(getURL('tumblr/v2/authorize'), { json: true }, (err, response, body) => {
    if (err) {
      res.redirect(`http://localhost:${getPort()}/tumblr`);
    } else {
      tmp = body.data;
      res.redirect(tmp.url);
    }
  });
});

app.get('/tumblr', (req, res) => {
  Request.post(
    getURL('tumblr/v2/authorize'),
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
