/* tslint:disable: no-console no-var-requires */
import { app } from 'electron';
import { Settings } from 'postybirb-commons';
const fs = require('fs-extra');
const path = require('path');
const low = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');
const util = require('./utils');

const settingsPath = path.join(global.BASE_DIRECTORY, 'data', 'settings.json');
fs.ensureFileSync(settingsPath);
const adapter = new FileSync(settingsPath);
const settings = low(adapter);
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
};
settings.defaults(settingDefaults).write();

if (!settings.getState().useHardwareAcceleration || util.isLinux()) {
  console.log('Hardware acceleration disabled');
  app.disableHardwareAcceleration();
}

global.settingsDB = settings;
