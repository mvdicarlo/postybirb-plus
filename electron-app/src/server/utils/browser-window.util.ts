import { BrowserWindow } from 'electron';
import WaitUtil from './wait.util';

export default class BrowserWindowUtil {
  private static async createWindow(partition: string, url: string) {
    const bw: Electron.BrowserWindow = new BrowserWindow({
      show: false,
      webPreferences: {
        partition: `persist:${partition}`,
        enableRemoteModule: false,
      },
    });

    await bw.loadURL(url);
    return bw;
  }

  public static async getLocalStorage(partition: string, url: string, wait?: number): Promise<any> {
    const bw = await BrowserWindowUtil.createWindow(partition, url);
    try {
      if (wait) {
        await WaitUtil.wait(wait);
      }
      return await bw.webContents.executeJavaScript('localStorage');
    } catch (err) {
      throw err;
    } finally {
      bw.destroy();
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
        `Array.from(new FormData(${
          selector.id ? `document.getElementById('${selector.id}')` : selector.custom
        })).reduce((obj, [k, v]) => ({...obj, [k]: v}), {})`,
      );
    } catch (err) {
      throw err;
    } finally {
      bw.destroy();
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
      html ? 'document.body.parentElement.innerHTML' : 'document.body.innerText',
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
      const page = await bw.webContents.executeJavaScript(script);
      return page;
    } catch (err) {
      throw err;
    } finally {
      bw.destroy();
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
      throw err;
    } finally {
      bw.destroy();
    }
  }
}
