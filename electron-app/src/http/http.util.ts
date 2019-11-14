import * as request from 'request';
import { session } from 'electron';
import 'url';

interface GetOptions {
  headers?: any;
  updateCookies?: boolean;
  requestOptions?: request.CoreOptions;
}

interface PostOptions extends GetOptions {
  data: any;
  type?: 'form' | 'multipart' | 'json';
}

interface HttpResponse<T> {
  body: T;
  response: request.Response;
  returnUrl: string;
}

export default class Http {
  static Request = request.defaults({
    headers: {
      'User-Agent': session.defaultSession.getUserAgent(),
    },
  });

  static async get<T>(
    uri: string,
    partitionId: string,
    options: GetOptions = {},
  ): Promise<HttpResponse<T>> {
    const _session = session.fromPartition(`persist:${partitionId}`);

    const headers = options.headers || {};
    if (!headers.cookies) {
      const cookies = await _session.cookies.get({
        url: new URL(uri).origin,
      });

      headers.cookies = cookies.map(c => `${c.name}=${c.value}`).join('; ');
    }

    const opts: request.CoreOptions = Object.assign(
      {
        headers,
      },
      options.requestOptions,
    );
    return new Promise((resolve, reject) => {
      Http.Request.get(uri, opts, (err, response, body) => {
        const res: HttpResponse<T> = {
          response,
          body,
          returnUrl: response.request.uri.href,
        };
        err ? reject(res) : resolve(res);
      });
    });
  }

  static async post<T>(
    uri: string,
    partitionId: string,
    options: PostOptions,
  ): Promise<HttpResponse<T>> {
    const _session = session.fromPartition(`persist:${partitionId}`);

    const headers = options.headers || {};
    if (!headers.cookies) {
      const cookies = await _session.cookies.get({
        url: new URL(uri).origin,
      });

      headers.cookies = cookies.map(c => `${c.name}=${c.value}`).join('; ');
    }

    const opts: request.CoreOptions = Object.assign(
      {
        headers,
      },
      options.requestOptions,
    );

    if (options.type === 'json') {
      opts.body = options.data;
      opts.json = true;
    } else if (options.type === 'multipart') {
      opts.formData = options.data;
    } else if (options.type === 'form') {
      opts.form = options.data;
    } else {
      opts.body = options.data;
    }

    return new Promise((resolve, reject) => {
      Http.Request.get(uri, opts, (err, response, body) => {
        const res: HttpResponse<T> = {
          response,
          body,
          returnUrl: response.request.uri.href,
        };
        err ? reject(res) : resolve(res);
      });
    });
  }
}
