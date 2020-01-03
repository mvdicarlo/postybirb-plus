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
  error: any;
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
    const ses = session.fromPartition(`persist:${partitionId}`);

    const headers = options.headers || {};
    if (!headers.cookie) {
      const cookies = await ses.cookies.get({
        url: new URL(uri).origin,
      });

      headers.cookie = cookies.map(c => `${c.name}=${c.value}`).join('; ');
    }

    const opts: request.CoreOptions = Object.assign(
      {
        headers,
      },
      options.requestOptions,
    );
    return new Promise(resolve => {
      Http.Request.get(uri, opts, (error, response, body) => {
        const res: HttpResponse<T> = {
          response,
          error,
          body,
          returnUrl: response.request.uri.href,
        };
        resolve(res);
      });
    });
  }

  static async post<T>(
    uri: string,
    partitionId: string,
    options: PostOptions,
  ): Promise<HttpResponse<T>> {
    const ses = session.fromPartition(`persist:${partitionId}`);

    const headers = options.headers || {};
    if (!headers.cookie) {
      const cookies = await ses.cookies.get({
        url: new URL(uri).origin,
      });

      headers.cookie = cookies.map(c => `${c.name}=${c.value}`).join('; ');
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

    return new Promise(resolve => {
      Http.Request.get(uri, opts, (error, response, body) => {
        const res: HttpResponse<T> = {
          error,
          response,
          body,
          returnUrl: response.request.uri.href,
        };
        resolve(res);
      });
    });
  }
}
