import * as lowdb from 'lowdb';

export interface AppGlobal extends NodeJS.Global {
  BASE_DIRECTORY: string;
  settingsDB: lowdb.LowdbSync<any>;
}
