/* tslint:disable: no-console no-var-requires */
import { app, dialog } from 'electron';
import { Settings } from 'postybirb-commons';
const fs = require('fs-extra');
const path = require('path');
const low = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');
const util = require('./utils');

const settingsPath = path.join(global.BASE_DIRECTORY, 'data', 'settings.json');
fs.ensureFileSync(settingsPath);
const settings = init();
const settingDefaults: Settings = {
  advertise: true,
  emptyQueueOnFailedPost: true,
  postRetries: 0,
  openWindowOnStartup: true,
  openOnLogin: false,
  useHardwareAcceleration: !util.isLinux(),
  maxPNGSizeCompression: 50,
  maxPNGSizeCompressionWithAlpha: 60,
  maxJPEGQualityCompression: 15,
  maxJPEGSizeCompression: 50,
  silentNotification: false,
  defaultTagSearchProvider: 'none',
  proxy: '',
  quitOnClose: false,
};
settings.defaults(settingDefaults).write();

if (!settings.getState().useHardwareAcceleration || util.isLinux()) {
  console.log('Hardware acceleration disabled');
  app.disableHardwareAcceleration();
}

global.settingsDB = settings;

function init() {
  try {
    const adapter = new FileSync(settingsPath);
    return low(adapter);
  } catch (e) {
    console.error('Error initializing settings database', e);
    fs.removeSync(settingsPath);
    dialog.showErrorBox(
      'Settings were corrupted',
      'Settings could not be loaded and had to be reset.',
    );
    const adapter = new FileSync(settingsPath);
    return low(adapter);
  }
}
