/* tslint:disable: no-console no-var-requires variable-name */
import { clipboard, dialog, shell, session, app, getCurrentWindow } from '@electron/remote';

// Authorizers
const Tumblr = require('./authorizers/tumblr.auth');
const DeviantArt = require('./authorizers/deviant-art.auth');

const _setImmediate = setImmediate;
const _clearImmediate = clearImmediate;
const _Buffer = Buffer;
process.once('loaded', () => {
  global.setImmediate = _setImmediate;
  global.clearImmediate = _clearImmediate;
  global.Buffer = _Buffer;
});

(window as any).PORT = (getCurrentWindow() as any).PORT;
(window as any).AUTH_ID = (getCurrentWindow() as any).AUTH_ID;
(window as any).IS_DARK_THEME = (getCurrentWindow() as any).IS_DARK_THEME;
(window as any).AUTH_SERVER_URL = (getCurrentWindow() as any).AUTH_SERVER_URL;
(window as any).appVersion = app.getVersion();
(window as any).electron = {
  clipboard: {
    availableFormats: clipboard.availableFormats,
    read() {
      const ni = clipboard.readImage();
      const arr = new Uint8Array(ni.toPNG());
      const blob = new Blob([arr], { type: 'image/png' });
      return new File([blob], 'Clipboard Image.png', {
        lastModified: Date.now(),
        type: 'image/png',
      });
    },
  },
  dialog: {
    showOpenDialog(options) {
      return dialog.showOpenDialog(getCurrentWindow(), options || {});
    },
  },
  session: {
    getCookies(accountId) {
      return session.fromPartition(`persist:${accountId}`).cookies.get({});
    },
    clearSessionData(id) {
      return session.fromPartition(`persist:${id}`).clearStorageData();
    },
  },
  shell: {
    openInBrowser(url) {
      return shell.openExternal(url);
    },
  },
  kill: () => app.quit(),
  auth: {
    Tumblr,
    DeviantArt,
  },
};
