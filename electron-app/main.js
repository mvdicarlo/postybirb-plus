const path = require('path');
const { app, BrowserWindow, Menu, nativeImage, nativeTheme, Tray } = require('electron');
const windowStateKeeper = require('electron-window-state');

const hasLock = app.requestSingleInstanceLock();
if (!hasLock) {
  app.quit();
  return;
}

process.env.PORT = process.env.PORT || 9247;
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
if (process.platform === 'win32') {
  app.setAppUserModelId('com.lemonynade.postybirb.plus');
}

app.on('second-instance', show);
app.on('activate', show);
app.on('window-all-closed', () => {});
app.on('ready', () => {
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
    console.log('\033[1m\x1b[36m', `\n\nAUTH ID: ${global.AUTH_ID}\n\n`, '\x1b[0m\033[0m');
    const menu = Menu.buildFromTemplate(require('./src-electron/menu'));
    Menu.setApplicationMenu(menu);
    const image = buildAppImage();
    global.tray = buildTray(image); // force to stay in memory
    initializedOnce = true;
    shouldDisplayWindow = settingsDB.getState().openOnStartup;
  }

  if (!shouldDisplayWindow) return; // observe user setting
  if (global.SERVER_ONLY_MODE) return;
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
      devTools: global.DEBUG_MODE,
      allowRunningInsecureContent: false,
      nodeIntegration: false,
      preload: path.join(__dirname, 'src-electron', 'preload.js'),
      webviewTag: true,
      contextIsolation: false,
      spellcheck: true,
    },
  });

  window.PORT = process.env.PORT;
  window.AUTH_ID = global.AUTH_ID;
  window.IS_DARK_THEME = nativeTheme.shouldUseDarkColors;
  if (global.DEBUG_MODE) {
    window.webContents.openDevTools();
  } else {
    mainWindowState.manage(window);
  }

  window.loadFile(`./build/index.html`);
  window.once('ready-to-show', () => window.show());
  window.webContents.on('new-window', event => event.preventDefault());
  window.on('closed', () => (window = null));
}

function buildAppImage() {
  let image = nativeImage.createFromPath(
    path.join(__dirname, '/build/assets/icons/minnowicon.png'),
  );
  if (process.platform === 'darwin') {
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

  if (process.platform === 'win32' || process.platform === 'darwin') {
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
