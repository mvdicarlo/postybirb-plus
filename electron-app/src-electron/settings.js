const { app } = require('electron');
const fs = require('fs-extra');
const path = require('path');
const low = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');
const log = require('electron-log');

const settingsPath = path.join(BASE_DIRECTORY, 'data', 'settings.json');
fs.ensureFileSync(settingsPath);
const adapter = new FileSync(settingsPath);
const settings = low(adapter);
settings
  .defaults({
    advertise: true,
    emptyQueueOnFailedPost: true,
    postRetries: 0,
    openOnStartup: true,
    useHardwareAcceleration: process.platform === 'win32' || process.platform === 'darwin',
  })
  .write();

if (
  !settings.getState().useHardwareAcceleration ||
  !(process.platform === 'win32' || process.platform === 'darwin')
) {
  log.info('Hardware acceleration disabled');
  app.disableHardwareAcceleration();
}

global.settingsDB = settings;
