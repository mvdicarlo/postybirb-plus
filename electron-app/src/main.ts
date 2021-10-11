/* tslint:disable: no-console no-var-requires */
const path = require('path');
import { app, BrowserWindow, Menu, nativeImage, nativeTheme, Tray, Notification } from 'electron';
import * as WindowStateKeeper from 'electron-window-state';
import { enableSleep } from './app/power-save';
import * as util from './app/utils';

const hasLock = app.requestSingleInstanceLock();
if (!hasLock) {
  app.quit();
  process.exit();
}

app.commandLine.appendSwitch('disable-renderer-backgrounding');
app.commandLine.appendSwitch('disable-background-timer-throttling');
app.commandLine.appendSwitch('disable-features', 'CrossOriginOpenerPolicy');

process.env.PORT = process.env.PORT || '9247';
global.AUTH_SERVER_URL = 'https://postybirb-auth.azurewebsites.net';
global.DEBUG_MODE = !!process.argv.find((arg) => arg === '-d' || arg === '--develop');
global.SERVER_ONLY_MODE = !!process.argv.find((arg) => arg === '-s' || arg === '--server');
global.BASE_DIRECTORY = path.join(app.getPath('documents'), 'PostyBirb');
global.CHILD_PROCESS_IDS = [];

if (global.DEBUG_MODE) {
  console.log(`BASE: ${global.BASE_DIRECTORY}`);
  console.log(`APP: ${app.getPath('userData')}`);
} else {
  process.env.NODE_ENV = 'production';
}

require('./app/crash-handler');
require('./app/auth-generator');
require('./app/settings');
require('electron-context-menu')({
  showInspectElement: false,
});

let nest: any;
let initializedOnce: boolean = false;
let mainWindowState: WindowStateKeeper.State = null;
let mainWindow: BrowserWindow = null;
let backgroundAlertTimeout = null;
let hasNotifiedAboutBackground = false;
const icon: string = path.join(__dirname, '../build/assets/icons/minnowicon.png');

// Enable windows 10 notifications
if (util.isWindows()) {
  app.setAppUserModelId('com.lemonynade.postybirb.plus');
}

const loader = require('../loader/loader');
app.on('second-instance', show);
app.on('activate', show);
app.on('window-all-closed', () => {});
app.on('ready', () => {
  app.allowRendererProcessReuse = false;
  app.userAgentFallback = app.userAgentFallback.replace(/Electron.*?\s/, ''); // EXPERIMENTAL: Attempt to get Google Sign-In working
  if (!global.SERVER_ONLY_MODE) {
    loader.show();
  }
  nest = require('./server/main');
  initialize();
});
app.on(
  'certificate-error',
  (
    event: Electron.Event,
    webContents: Electron.WebContents,
    url: string,
    error: string,
    certificate: Electron.Certificate,
    callback: (allow: boolean) => void,
  ) => {
    if (
      certificate.issuerName === 'postybirb.com' &&
      certificate.subject.organizations[0] === 'PostyBirb' &&
      certificate.issuer.country === 'US'
    ) {
      callback(true);
    } else {
      callback(false);
    }
  },
);
app.on('quit', () => {
  enableSleep();
  clearTimeout(backgroundAlertTimeout);
  global.CHILD_PROCESS_IDS.forEach((id) => process.kill(id));
});

async function initialize() {
  if (!hasLock) {
    return;
  }

  let shouldDisplayWindow = true;
  if (!initializedOnce) {
    await nest();
    const menu = Menu.buildFromTemplate(require('./app/menu'));
    Menu.setApplicationMenu(menu);
    const image = buildAppImage();
    global.tray = buildTray(image); // force to stay in memory
    initializedOnce = true;
    shouldDisplayWindow = global.settingsDB.getState().openWindowOnStartup;
  }

  if (global.SERVER_ONLY_MODE) {
    return;
  }

  if (!shouldDisplayWindow) {
    // observe user setting
    loader.hide();
    return;
  }
  createWindow();
}

function createWindow() {
  if (!mainWindowState) {
    mainWindowState = WindowStateKeeper({
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
      preload: path.join(__dirname, 'app', 'preload.js'),
      webviewTag: true,
      contextIsolation: false,
      spellcheck: true,
      backgroundThrottling: false,
      enableRemoteModule: true,
    },
  });


  (mainWindow as any).PORT = process.env.PORT;
  (mainWindow as any).AUTH_ID = global.AUTH_ID;
  (mainWindow as any).AUTH_SERVER_URL = global.AUTH_SERVER_URL;
  (mainWindow as any).IS_DARK_THEME = nativeTheme.shouldUseDarkColors;
  if (!global.DEBUG_MODE) {
    mainWindowState.manage(mainWindow);
  }

  mainWindow.webContents.on('new-window', (event) => event.preventDefault());
  mainWindow.on('closed', () => {
    mainWindow = null;
    if (global.tray && util.isWindows()) {
      clearTimeout(backgroundAlertTimeout);
      if (!hasNotifiedAboutBackground) {
        backgroundAlertTimeout = setTimeout(() => {
          hasNotifiedAboutBackground = true;
          const notification = new Notification({
            title: 'PostyBirb',
            icon,
            body: 'PostyBirb will continue in the background.',
            silent: true,
          });
          notification.show();
        }, 750);
      }
    }
  });

  mainWindow.loadFile(path.join(__dirname, '../build/index.html')).then(() => {
    loader.hide();
    mainWindow.show();
    if (global.DEBUG_MODE) {
      mainWindow.webContents.openDevTools();
    }
  });
}

function buildAppImage(): Electron.NativeImage {
  let image = nativeImage.createFromPath(icon);
  if (util.isOSX()) {
    image = image.resize({
      width: 16,
      height: 16,
    });
  }

  return image;
}

function buildTray(image: Electron.NativeImage): Tray {
  const trayItems: Array<Electron.MenuItem | Electron.MenuItemConstructorOptions> = [
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
      checked: global.settingsDB.get('openOnLogin').value(),
      click(event: any) {
        app.setLoginItemSettings({
          openAtLogin: event.checked,
          path: app.getPath('exe'),
        });
        global.settingsDB.set('openOnLogin', event.checked).write();
      },
    });
  }

  const tray = new Tray(image);
  tray.setContextMenu(Menu.buildFromTemplate(trayItems));
  tray.setToolTip('PostyBirb');
  tray.on('click', () => show());
  return tray;
}

function show(): void {
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
