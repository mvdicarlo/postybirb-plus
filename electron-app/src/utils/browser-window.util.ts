import { BrowserWindow } from 'electron';

export default class BrowserWindowUtil {
  private static async createWindow(partition: string, url: string) {
    const bw: Electron.BrowserWindow = new BrowserWindow({
      show: false,
      webPreferences: {
        partition: `persist:${partition}`,
      },
    });

    await bw.loadURL(url);
    return bw;
  }

  public static async getLocalStorage(partition: string, url: string): Promise<any> {
    const bw = await BrowserWindowUtil.createWindow(partition, url);
    try {
      return await bw.webContents.executeJavaScript('localStorage');
    } catch (err) {
      bw.destroy();
      throw err;
    }
  }

  public static async getFormData(partition: string, url: string, selector: string): Promise<any> {
    const bw = await BrowserWindowUtil.createWindow(partition, url);
    try {
      return await bw.webContents.executeJavaScript(
        `Array.from(new FormData(${selector})).reduce((obj, [k, v]) => ({...obj, [k]: v}), {})`,
      );
    } catch (err) {
      bw.destroy();
      throw err;
    }
  }
}
