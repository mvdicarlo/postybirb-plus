import { BrowserWindow } from 'electron';
import WaitUtil from './wait.util';

export default class BrowserWindowUtil {
  private static async createWindow(partition: string, url: string) {
    const bw: Electron.BrowserWindow = new BrowserWindow({
      show: false,
      webPreferences: {
        partition: `persist:${partition}`,
      },
    });

    try {
      await bw.loadURL(url);
    } catch (err) {
      bw.destroy();
      throw err;
    }

    return bw;
  }

  public static async getLocalStorage(partition: string, url: string, wait?: number): Promise<any> {
    const bw = await BrowserWindowUtil.createWindow(partition, url);
    try {
      if (wait) {
        await WaitUtil.wait(wait);
      }
      return await bw.webContents.executeJavaScript('JSON.parse(JSON.stringify(localStorage))');
    } catch (err) {
      bw.destroy();
      throw err;
    } finally {
      if (!bw.isDestroyed()) {
        bw.destroy();
      }
    }
  }

  public static async getFormData(
    partition: string,
    url: string,
    selector: { id?: string; custom?: string },
  ): Promise<any> {
    const bw = await BrowserWindowUtil.createWindow(partition, url);
    try {
      return await bw.webContents.executeJavaScript(
        `JSON.parse(JSON.stringify(Array.from(new FormData(${
          selector.id ? `document.getElementById('${selector.id}')` : selector.custom
        })).reduce((obj, [k, v]) => ({...obj, [k]: v}), {})))`,
      );
    } catch (err) {
      bw.destroy();
      throw err;
    } finally {
      if (!bw.isDestroyed()) {
        bw.destroy();
      }
    }
  }

  public static async getPage(
    partition: string,
    url: string,
    html: boolean,
    wait: number = 0,
  ): Promise<string> {
    return BrowserWindowUtil.runScriptOnPage<string>(
      partition,
      url,
      html ? 'return document.body.parentElement.innerHTML' : 'return document.body.innerText',
      wait,
    );
  }

  public static async runScriptOnPage<T>(
    partition: string,
    url: string,
    script: string,
    wait: number = 0,
  ): Promise<T> {
    const bw = await BrowserWindowUtil.createWindow(partition, url);
    try {
      if (wait) {
        await WaitUtil.wait(wait);
      }

      // Using promise to handle errors. See more: https://github.com/electron/electron/pull/11158
      const page = await bw.webContents.executeJavaScript(`
      (function() {
        try {
          ${script}
        } catch (e) {
          return Promise.reject(e);
        }
      })()`);
      return page;
    } catch (err) {
      if (typeof err === 'object' && err && typeof err.message === 'string') {
        err.message =
          'Failed to run script on page: ' + err.message + '\n\nscript:\n' + script + '\n';
      }

      bw.destroy();
      throw err;
    } finally {
      if (!bw.isDestroyed()) {
        bw.destroy();
      }
    }
  }

  public static async post<T>(
    partition: string,
    url: string,
    headers: object,
    data: object,
  ): Promise<T> {
    const bw = await BrowserWindowUtil.createWindow(partition, url);
    try {
      await bw.loadURL(url, {
        extraHeaders: Object.entries(headers)
          .map(([key, value]) => `${key}: ${value}`)
          .join('\n'),
        postData: [
          {
            type: 'rawData',
            bytes: Buffer.from(JSON.stringify(data)),
          },
        ],
      });
      return await bw.webContents.executeJavaScript('document.body.innerText');
    } catch (err) {
      bw.destroy();
      throw err;
    } finally {
      if (!bw.isDestroyed()) {
        bw.destroy();
      }
    }
  }
}
