const path = require('path');
const {
  app,
  BrowserWindow,
  Menu,
  nativeImage,
  nativeTheme,
  Tray,
  Notification,
} = require('electron');
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

require('./src-electron/crash-handler');
require('./src-electron/auth-generator');
require('./src-electron/settings');
require('electron-context-menu')({
  showInspectElement: false,
});

let nest;
let initializedOnce = false;
let mainWindowState = null;
let backgroundAlertTimeout = null;
const icon = path.join(__dirname, '/build/assets/icons/minnowicon.png');

// Enable windows 10 notifications
if (util.isWindows()) {
  app.setAppUserModelId('com.lemonynade.postybirb.plus');
}

const loader = require('./loader/loader');
app.on('second-instance', show);
app.on('activate', show);
app.on('window-all-closed', () => {});
app.on('ready', () => {
  app.userAgentFallback = app.userAgentFallback.replace(/Electron.*?\s/, ''); // EXPERIMENTAL: Attempt to get Google Sign-In working
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
  clearTimeout(backgroundAlertTimeout);
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
    shouldDisplayWindow = settingsDB.getState().openWindowOnStartup;
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

  mainWindow = new BrowserWindow({
    show: false,
    width: mainWindowState.width,
    height: mainWindowState.height,
    minWidth: 500,
    minHeight: 500,
    autoHideMenuBar: true,
    icon,
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

  mainWindow.PORT = process.env.PORT;
  mainWindow.AUTH_ID = global.AUTH_ID;
  mainWindow.AUTH_SERVER_URL = global.AUTH_SERVER_URL;
  mainWindow.IS_DARK_THEME = nativeTheme.shouldUseDarkColors;
  if (!global.DEBUG_MODE) {
    mainWindowState.manage(window);
  }

  mainWindow.webContents.on('new-window', event => event.preventDefault());
  mainWindow.on('closed', () => {
    mainWindow = null;
    if (global.tray && util.isWindows()) {
      clearTimeout(backgroundAlertTimeout);
      backgroundAlertTimeout = setTimeout(() => {
        const notification = new Notification({
          icon,
          body: 'PostyBirb will continue in the background.',
          silent: true,
        });
        notification.show();
      }, 750);
    }
  });

  mainWindow.loadFile(`./build/index.html`).then(() => {
    loader.hide();
    mainWindow.show();
    if (global.DEBUG_MODE) {
      mainWindow.webContents.openDevTools();
    }
  });
}

function buildAppImage() {
  let image = nativeImage.createFromPath(icon);
  if (util.isOSX()) {
    image = image.resize({
      width: 16,
      height: 16,
    });
  }

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
  if (!mainWindow) {
    createWindow();
    return;
  }
  if (mainWindow.isMinimized()) {
    mainWindow.restore();
  } else {
    mainWindow.show();
  }
  mainWindow.focus();
}

global.showApp = show;
