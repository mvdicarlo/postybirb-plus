import * as lowdb from 'lowdb';

export interface AppGlobal extends NodeJS.Global {
  AUTH_ID: string;
  BASE_DIRECTORY: string;
  DEBUG_MODE: boolean;
  settingsDB: lowdb.LowdbSync<any>;
}
