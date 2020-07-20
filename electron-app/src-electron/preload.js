const { remote, clipboard, shell } = require('electron');
const { app, session } = remote;

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

// Process.env is overwritten in the .tsx files for login. Why, I'm unsure, but I suspect it may be security related.
// Assuming it is, this will act as a whitelist of environment variables to include from the electron-app process,
// such that it should be (at least marginally) more difficult to pull system information from a potential unsafe eval,
// should such an exploit exist.
const environment = {
  // Should be set with fallback by main.js
  ARTCONOMY_URL: process.env.ARTCONOMY_URL,
}

window.PORT = remote.getCurrentWindow().PORT;
window.AUTH_ID = remote.getCurrentWindow().AUTH_ID;
window.IS_DARK_THEME = remote.getCurrentWindow().IS_DARK_THEME;
window.AUTH_SERVER_URL = remote.getCurrentWindow().AUTH_SERVER_URL;
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
  environment,
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
