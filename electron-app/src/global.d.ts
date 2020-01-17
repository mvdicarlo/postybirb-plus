import * as lowdb from 'lowdb';

declare global {
  namespace NodeJS {
    interface Global {
      AUTH_ID: string;
      BASE_DIRECTORY: string;
      DEBUG_MODE: boolean;
      SERVER_ONLY_MODE: boolean;
      settingsDB: lowdb.LowdbSync<any>;
      showApp: () => void;
    }
  }
}
export default global;
