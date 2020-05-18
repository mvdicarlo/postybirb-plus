const path = require('path');
const { app, BrowserWindow, Menu, nativeImage, nativeTheme, Tray } = require('electron');
const windowStateKeeper = require('electron-window-state');
const util = require('./src-electron/utils');

const hasLock = app.requestSingleInstanceLock();
if (!hasLock) {
  app.quit();
  return;
}

app.commandLine.appendSwitch('disable-renderer-backgrounding');
app.commandLine.appendSwitch('disable-background-timer-throttling');

process.env.PORT = process.env.PORT || 9247;
global.AUTH_SERVER_URL = 'http://postybirb.cleverapps.io';
global.DEBUG_MODE = !!process.argv.find(arg => arg === '-d' || arg === '--develop');
global.SERVER_ONLY_MODE = !!process.argv.find(arg => arg === '-s' || arg === '--server');
global.BASE_DIRECTORY = path.join(app.getPath('documents'), 'PostyBirb');
global.CHILD_PROCESS_IDS = [];

if (DEBUG_MODE) {
  console.log(`BASE: ${BASE_DIRECTORY}`);
  console.log(`APP: ${app.getPath('userData')}`);
}

require('./src-electron/auth-generator');
require('./src-electron/settings');
require('electron-context-menu')({
  showInspectElement: false,
});

let nest;
let window = null;
let initializedOnce = false;
let mainWindowState = null;

// Enable windows 10 notifications
if (util.isWindows()) {
  app.setAppUserModelId('com.lemonynade.postybirb.plus');
}

const loader = require('./loader/loader');
app.on('second-instance', show);
app.on('activate', show);
app.on('window-all-closed', () => {});
app.on('ready', () => {
  if (!global.SERVER_ONLY_MODE) {
    loader.show();
  }
  nest = require('./dist/main');
  initialize();
});
app.on('certificate-error', (event, webContents, url, error, certificate, callback) => {
  if (
    certificate.issuerName === 'postybirb.com' &&
    certificate.subject.organizations[0] === 'PostyBirb' &&
    certificate.issuer.country === 'US'
  ) {
    callback(true);
  } else {
    callback(false);
  }
});
app.on('quit', () => {
  global.CHILD_PROCESS_IDS.forEach(id => process.kill(id));
});

async function initialize() {
  if (!hasLock) return;

  let shouldDisplayWindow = true;
  if (!initializedOnce) {
    await nest();
    const menu = Menu.buildFromTemplate(require('./src-electron/menu'));
    Menu.setApplicationMenu(menu);
    const image = buildAppImage();
    global.tray = buildTray(image); // force to stay in memory
    initializedOnce = true;
    shouldDisplayWindow = settingsDB.getState().openOnStartup;
  }

  if (global.SERVER_ONLY_MODE) return;

  if (!shouldDisplayWindow) {
    // observe user setting
    loader.hide();
    return;
  }
  createWindow();
}

function createWindow() {
  if (!mainWindowState) {
    mainWindowState = windowStateKeeper({
      defaultWidth: 992,
      defaultHeight: 800,
    });
  }

  window = new BrowserWindow({
    show: false,
    width: mainWindowState.width,
    height: mainWindowState.height,
    minWidth: 500,
    minHeight: 500,
    autoHideMenuBar: true,
    icon: path.join(__dirname, '/build/assets/icons/minnowicon.png'),
    title: 'PostyBirb',
    darkTheme: nativeTheme.shouldUseDarkColors,
    webPreferences: {
      devTools: true,
      allowRunningInsecureContent: false,
      nodeIntegration: false,
      preload: path.join(__dirname, 'src-electron', 'preload.js'),
      webviewTag: true,
      contextIsolation: false,
      spellcheck: true,
      backgroundThrottling: false,
    },
  });

  window.PORT = process.env.PORT;
  window.AUTH_ID = global.AUTH_ID;
  window.AUTH_SERVER_URL = global.AUTH_SERVER_URL;
  window.IS_DARK_THEME = nativeTheme.shouldUseDarkColors;
  if (!global.DEBUG_MODE) {
    mainWindowState.manage(window);
  }

  window.loadFile(`./build/index.html`);
  window.once('ready-to-show', () => {
    loader.hide();
    window.show();
    if (global.DEBUG_MODE) {
      window.webContents.openDevTools();
    }
  });
  window.webContents.on('new-window', event => event.preventDefault());
  window.on('closed', () => (window = null));
}

function buildAppImage() {
  let image = nativeImage.createFromPath(
    path.join(__dirname, '/build/assets/icons/minnowicon.png'),
  );
  if (util.isOSX()) {
    image = image.resize({
      width: 16,
      height: 16,
    });
  }

  // image.setTemplateImage(true);
  return image;
}

function buildTray(image) {
  const trayItems = [
    {
      label: 'Open',
      click() {
        show();
      },
    },
    {
      label: 'Quit',
      click() {
        app.quit();
      },
    },
  ];

  if (!util.isLinux()) {
    trayItems.splice(0, 0, {
      label: 'Open on startup',
      type: 'checkbox',
      checked: settingsDB.get('openOnLogin').value(),
      click(event) {
        app.setLoginItemSettings({
          openAtLogin: event.checked,
          path: app.getPath('exe'),
        });
        settingsDB.set('openOnLogin', event.checked).write();
      },
    });
  }

  const tray = new Tray(image);
  tray.setContextMenu(Menu.buildFromTemplate(trayItems));
  tray.setToolTip('PostyBirb');
  tray.on('click', () => show());
  return tray;
}

function show() {
  if (!window) {
    createWindow();
    return;
  }
  if (window.isMinimized()) {
    window.restore();
  } else {
    window.show();
  }
  window.focus();
}

global.showApp = show;
