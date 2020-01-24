const { remote, clipboard, shell } = require('electron');
const { app, session } = remote;

window.PORT = remote.getCurrentWindow().PORT;
window.AUTH_ID = remote.getCurrentWindow().AUTH_ID;
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
};
