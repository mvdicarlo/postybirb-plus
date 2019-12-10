const { remote, clipboard } = require('electron');
const { app } = remote;

window.PORT = remote.getCurrentWindow().PORT;
window.appVersion = app.getVersion();
window.electron = {
    clipboard: {
        availableFormats: clipboard.availableFormats,
        read() {
            const ni = clipboard.readImage();
            const arr = new Uint8Array(ni.toPNG());
            const blob = new Blob([arr], { type: 'image/png' });
            return new File([blob], 'Clipboard Image', { lastModified: Date.now() , type: 'image/png' });
        }
    }
}