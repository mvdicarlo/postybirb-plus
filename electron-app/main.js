const path = require('path');
const {
    app,
    BrowserWindow,
    Menu,
    nativeImage,
    Tray
} = require('electron');
const windowStateKeeper = require('electron-window-state');
const log = require('electron-log');
const low = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync')

process.env.PORT = 9247;
process.env.DEVMODE = !!process.argv.find(
    arg => arg === '-d' || arg === '--develop',
);

const hasLock = app.requestSingleInstanceLock();
if (!hasLock) {
    app.quit();
    return;
}

let nest;

global.BASE_DIRECTORY = `${app.getPath('documents')}/PostyBirb`;

const adapter = new FileSync(`${BASE_DIRECTORY}/data/settings.json`);
const settings = low(adapter);
settings.defaults({
    advertise: true,
    emptyQueueOnFailedPost: true,
    postInterval: 0,
    postRetries: 0,
    openOnStartup: true,
    useHardwareAcceleration: process.platform === 'win32' || process.platform === 'darwin',
}).write();

global.settingsDB = settings;

if (!settings.getState().useHardwareAcceleration || !(process.platform === 'win32' || process.platform === 'darwin')) {
    log.info('Hardware acceleration disabled');
    app.disableHardwareAcceleration();
}

app.on('second-instance', show);
app.on('window-all-closed', () => {});
app.on('ready', () => {
    nest = require('./dist/main');
    initialize()
});

let window = null;
let initializedOnce = false;

async function initialize() {
    if (!hasLock) return;

    let shouldDisplayWindow = true;
    if (!initializedOnce) {
        await nest();
        const menu = Menu.buildFromTemplate(require('./menu'));
        Menu.setApplicationMenu(menu);
        const image = buildAppImage();
        buildTray(image);
        initializedOnce = true;
        shouldDisplayWindow = settings.getState().openOnStartup;
    }

    if (!shouldDisplayWindow) return; // observe user setting

    const mainWindowState = windowStateKeeper({
        defaultWidth: 992,
        defaultHeight: 800,
    });

    window = new BrowserWindow({
        show: false,
        width: mainWindowState.width,
        height: mainWindowState.height,
        minWidth: 500,
        minHeight: 500,
        autoHideMenuBar: true,
        icon: path.join(__dirname, '/build/assets/icons/minnowicon.png'),
        title: 'PostyBirb',
        webPreferences: {
            devTools: process.env.DEVMODE,
            allowRunningInsecureContent: false,
            nodeIntegration: false,
            preload: path.join(__dirname, 'preload.js'),
            webviewTag: true,
            backgroundThrottling: false,
            contextIsolation: false,
        },
    });

    window.PORT = process.env.PORT;
    if (process.env.DEVMODE) {
        window.webContents.openDevTools();
    } else {
        mainWindowState.manage(window);
    }

    window.loadFile(`./build/index.html`);
    window.once('ready-to-show', () => window.show());
    window.webContents.on('new-window', event => event.preventDefault());
    window.on('closed', () => {
        window = null;
    });
}

function buildAppImage() {
    let image = nativeImage.createFromPath(path.join(__dirname, '/build/assets/icons/minnowicon.png'));
    if (process.platform === 'darwin') {
        image = image.resize({
            width: 16,
            height: 16,
        });
    }
    image.setTemplateImage(true);
    return image;
}

function buildTray(image) {
    const trayItems = [{
            label: 'Open',
            click() {
                show();
            },
        },
        {
            label: 'Quit',
            click() {
                console.log('me')
                processes.forEach(proc => proc.kill());
                app.quit();
            },
        },
    ];

    const tray = new Tray(image);
    tray.setContextMenu(Menu.buildFromTemplate(trayItems));
    tray.setToolTip('PostyBirb');
    tray.on('click', () => show());
    return tray;
}

function show() {
    if (!window) {
        initialize();
        return;
    }
    if (window.isMinimized()) {
        window.restore();
    } else {
        window.show();
    }
    window.focus();
}