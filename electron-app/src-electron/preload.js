const { remote, clipboard, shell } = require('electron');
const { app, session } = remote;
const tumblr = require('./authorizers/tumblr.auth');

const _setImmediate = setImmediate;
const _clearImmediate = clearImmediate;
const _Buffer = Buffer;
process.once('loaded', () => {
  global.setImmediate = _setImmediate;
  global.clearImmediate = _clearImmediate;
  global.Buffer = _Buffer;
});

window.PORT = remote.getCurrentWindow().PORT;
window.AUTH_ID = remote.getCurrentWindow().AUTH_ID;
window.IS_DARK_THEME = remote.getCurrentWindow().IS_DARK_THEME;
window.appVersion = app.getVersion();
window.electron = {
  clipboard: {
    availableFormats: clipboard.availableFormats,
    read() {
      const ni = clipboard.readImage();
      const arr = new Uint8Array(ni.toPNG());
      const blob = new Blob([arr], { type: 'image/png' });
      return new File([blob], 'Clipboard Image', { lastModified: Date.now(), type: 'image/png' });
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
    tumblr,
  },
};
