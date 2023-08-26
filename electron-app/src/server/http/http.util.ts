import request from 'request';
import { BrowserWindow, LoadURLOptions, session } from 'electron';
import 'url';
import _ from 'lodash';
import CookieConverter from 'src/server/utils/cookie-converter.util';
import setCookie from 'set-cookie-parser';
import { Logger } from '@nestjs/common';
const FormData = require('form-data');

interface GetOptions {
  headers?: any;
  updateCookies?: boolean;
  requestOptions?: request.CoreOptions;
  skipCookies?: boolean;
}

interface PostOptions extends GetOptions {
  data?: any;
  type?: 'form' | 'multipart' | 'json' | 'function';
}

export interface HttpResponse<T> {
  body: T;
  error: any;
  response: request.Response;
  returnUrl: string;
}

export default class Http {
  private static logger: Logger = new Logger(Http.name);
  static Request = request.defaults({
    headers: {
      'User-Agent': session.defaultSession.getUserAgent(),
    }
  });

  static parseCookies(cookies: Electron.Cookie[]) {
    return cookies.map((c) => `${c.name}=${c.value}`).join('; ');
  }

  static async getWebsiteCookies(partitionId: string, url: string): Promise<Electron.Cookie[]> {
    return await session.fromPartition(`persist:${partitionId}`).cookies.get({
      url: new URL(url).origin,
    });
  }

  static async retrieveCookieString(
    url: string,
    ses: Electron.Session,
    cookies?: string,
  ): Promise<string> {
    if (cookies) {
      return cookies;
    }

    const sessionCookies = await ses.cookies.get({
      url: new URL(url).origin,
    });

    return Http.parseCookies(sessionCookies);
  }

  static async saveSessionCookies(uri: string, partitionId: string) {
    const ses = session.fromPartition(`persist:${partitionId}`);
    const url = new URL(uri).origin;
    const cookies = await ses.cookies.get({
      url,
    });
    let expirationDate = new Date();
    expirationDate = new Date(expirationDate.setMonth(expirationDate.getMonth() + 2));
    await Promise.all(
      cookies
        .filter((c) => c.session)
        .map((c) => {
          const cookie: Electron.CookiesSetDetails = {
            ...CookieConverter.convertCookie(c),
            expirationDate: expirationDate.valueOf() / 1000,
          };
          return ses.cookies.set(cookie);
        }),
    );
    ses.flushStorageData();
  }

  private static getCommonOptions(
    headers: Record<string, any>,
    requestOptions?: request.CoreOptions,
  ): request.CoreOptions {
    return Object.assign(
      {
        headers,
        followAllRedirects: true,
        timeout: 480_000,
      },
      requestOptions,
    );
  }

  static async get<T>(
    uri: string,
    partitionId: string,
    options: GetOptions = {},
  ): Promise<HttpResponse<T>> {
    options = options || {};
    let ses: Electron.Session;
    options = options || {};
    if (partitionId) {
      ses = session.fromPartition(`persist:${partitionId}`);
    }
    const headers = options.headers || {};
    if (!options.skipCookies && ses) {
      headers.cookie = await Http.retrieveCookieString(uri, ses, headers.cookie);
    }

    const opts = Http.getCommonOptions(headers, options.requestOptions);
    return new Promise((resolve) => {
      Http.Request.get(uri, opts, async (error, response, body) => {
        const res: HttpResponse<T> = {
          response,
          error,
          body,
          returnUrl: _.get(response, 'request.uri.href'),
        };

        if (error) {
          Http.logger.error(error, null, uri);
        }

        if (options.updateCookies && response.headers['set-cookie']) {
          const cookies = setCookie.parse(response);
          const ses = session.fromPartition(`persist:${partitionId}`);
          let future = new Date();
          future = new Date(future.setMonth(future.getMonth() + 2));
          for (const c of cookies) {
            c.domain = c.domain || response.request.host;
            const cc = CookieConverter.convertCookie(c as Electron.Cookie);
            cc.expirationDate = future.valueOf() / 1000;
            await ses.cookies.set(cc);
          }
        }
        resolve(res);
      });
    });
  }

  static async patch<T>(
    uri: string,
    partitionId: string | undefined,
    options: PostOptions,
  ): Promise<HttpResponse<T>> {
    return Http.postLike('patch', uri, partitionId, options);
  }

  static async post<T>(
    uri: string,
    partitionId: string | undefined,
    options: PostOptions,
  ): Promise<HttpResponse<T>> {
    return Http.postLike('post', uri, partitionId, options);
  }

  private static async postLike<T>(
    type: 'post' | 'patch',
    uri: string,
    partitionId: string | undefined,
    options: PostOptions,
  ): Promise<HttpResponse<T>> {
    let ses: Electron.Session;
    options = options || {};
    if (partitionId) {
      ses = session.fromPartition(`persist:${partitionId}`);
    }

    const headers = options.headers || {};
    if (!options.skipCookies && ses) {
      headers.cookie = await Http.retrieveCookieString(uri, ses, headers.cookie);
    }

    const opts = Http.getCommonOptions(headers, options.requestOptions);
    if (options.type === 'json') {
      opts.body = options.data;
      opts.json = true;
    } else if (options.type === 'multipart') {
      opts.formData = options.data;
    } else if (options.type === 'form') {
      opts.form = options.data;
    } else if (options.type === 'function') {
      // Do nothing here
    } else {
      opts.body = options.data;
    }

    return new Promise((resolve) => {
      const request = Http.Request[type](uri, opts, async (error, response, body) => {
        const res: HttpResponse<T> = {
          error,
          response,
          body,
          returnUrl: _.get(response, 'request.uri.href'),
        };
        if (error) {
          Http.logger.error(error, null, uri);
        }
        if (typeof body === 'string' && body.includes('resolve_captcha')) {
          if (options.type === 'multipart') {
            const win = new BrowserWindow({
              show: false,
              webPreferences: {
                partition: `persist:${partitionId}`,
              },
            });

            try {
              const form = new FormData();
              Object.entries(options.data).forEach(([key, value]: [string, any]) => {
                if (value.options && value.value) {
                  form.append(key, value.value, value.options);
                } else if (Array.isArray(value)) {
                  form.append(key, JSON.stringify(value));
                } else {
                  form.append(key, value);
                }
              });

              const opts: LoadURLOptions = {
                postData: [
                  {
                    type: 'rawData',
                    bytes: form.getBuffer(),
                  },
                ],
                extraHeaders: [
                  `Content-Type: ${form.getHeaders()['content-type']}`,
                  ...Object.entries(options.headers || {}).map(
                    ([key, value]) => `${key}: ${value}`,
                  ),
                ].join('\n'),
              };

              await win.loadURL(uri, opts);
              const result = await win.webContents.executeJavaScript('document.body.innerText');
              let data = null;
              try {
                data = options.requestOptions.json ? JSON.parse(result) : result;
              } catch {
                data = result;
              }
              res.body = data;
              // Potential false completes?
              res.response.statusCode = 200;
            } catch (err) {
              Http.logger.warn(err, `Cloudflare Skip: ${uri}`);
            } finally {
              win.destroy();
            }
          } else if (options.type === 'json') {
            const win = new BrowserWindow({
              show: false,
              webPreferences: {
                partition: `persist:${partitionId}`,
              },
            });

            try {
              const opts: LoadURLOptions = {
                postData: [
                  {
                    type: 'rawData',
                    bytes: Buffer.from(JSON.stringify(options.data)),
                  },
                ],
                extraHeaders: [
                  `Content-Type: application/json`,
                  ...Object.entries(options.headers || {}).map(
                    ([key, value]) => `${key}: ${value}`,
                  ),
                ].join('\n'),
              };

              await win.loadURL(uri, opts);
              const result = await win.webContents.executeJavaScript('document.body.innerText');
              let data = null;
              try {
                data = options.requestOptions.json ? JSON.parse(result) : result;
              } catch {
                data = result;
              }
              res.body = data;
              // Potential false completes?
              res.response.statusCode = 200;
            } catch (err) {
              Http.logger.warn(err, `Cloudflare Skip: ${uri}`);
            } finally {
              win.destroy();
            }
          }
        }
        resolve(res);
      });

      if (options.type === 'function' && options.data) {
        options.data(request.form());
      }
    });
  }
}
