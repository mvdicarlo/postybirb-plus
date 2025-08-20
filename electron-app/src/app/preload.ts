/* tslint:disable: no-console no-var-requires variable-name */
import { clipboard, shell, ipcRenderer } from 'electron';

// Authorizers are handled via IPC in main process

const _setImmediate = setImmediate;
const _clearImmediate = clearImmediate;
const _Buffer = Buffer;
process.once('loaded', () => {
  global.setImmediate = _setImmediate;
  global.clearImmediate = _clearImmediate;
  global.Buffer = _Buffer;
});

(function initializeGlobals() {
  try {
    const cfg = ipcRenderer.sendSync('app:get-config');
    (window as any).PORT = cfg?.PORT;
    (window as any).AUTH_ID = cfg?.AUTH_ID;
    (window as any).IS_DARK_THEME = cfg?.IS_DARK_THEME;
    (window as any).AUTH_SERVER_URL = cfg?.AUTH_SERVER_URL;
    (window as any).appVersion = cfg?.appVersion;
  } catch (e) {
    // Leave unset if main hasn't registered handler yet
    // Renderer code should handle undefined gracefully
  }
})();
(window as any).electron = {
  clipboard: {
    availableFormats: () => {
      // Delegate to main for accurate formats in all cases
      return ipcRenderer.sendSync('clipboard:availableFormatsSync') || [];
    },
    read() {
      try {
        const res = ipcRenderer.sendSync('clipboard:readImageSync');
        if (!res || !res.base64) return undefined;
        const binary = atob(res.base64);
        const len = binary.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) bytes[i] = binary.charCodeAt(i);
        const blob = new Blob([bytes], { type: res.type || 'image/png' });
        return new File([blob], 'Clipboard Image.png', {
          lastModified: Date.now(),
          type: res.type || 'image/png',
        });
      } catch {
        return undefined;
      }
    },
  },
  dialog: {
    showOpenDialog(options) {
      return ipcRenderer.invoke('dialog:showOpenDialog', options || {});
    },
  },
  session: {
    getCookies(accountId) {
      return ipcRenderer.invoke('session:getCookies', accountId);
    },
    clearSessionData(id) {
      return ipcRenderer.invoke('session:clearSessionData', id);
    },
  },
  shell: {
    openInBrowser(url) {
      return shell.openExternal(url);
    },
  },
  kill: () => ipcRenderer.send('app:quit'),
  auth: {
    Tumblr: {
      getAuthURL: () => ipcRenderer.sendSync('auth:tumblr:getAuthURL'),
      start: (cb: (data: any) => any) => {
        // Wire a one-off channel for callback
        const channel = `tumblr:auth:cb:${Date.now()}:${Math.random().toString(36).slice(2)}`;
        const listener = (_event, data) => cb?.(data);
        (window as any).__tumblrAuthListener = listener;
        ipcRenderer.on(channel, listener);
        return ipcRenderer.invoke('auth:tumblr:start', channel);
      },
      stop: () => ipcRenderer.invoke('auth:tumblr:stop'),
    },
  },
};
