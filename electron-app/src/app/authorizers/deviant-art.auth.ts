import * as express from 'express';
import { getURL } from './common.auth';
import * as Request from 'request';
import { Server } from 'http';

const app = express();
let cb: (data: any) => any;
let server: Server;

export function getAuthURL() {
  return getURL('deviant-art/v1/authorize');
}

export function start(callback: (data: any) => any) {
  cb = callback;
  if (!server) {
    server = app.listen(4200); // Hard coded 4200 because DA bad >:(
  }
}

export function stop() {
  if (server) {
    server.close();
  }
  cb = null;
  server = null;
}

function getAccessToken(code: string) {
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
  getAccessToken(req.query.code as string);
});
