import * as lowdb from 'lowdb';

declare global {
  namespace NodeJS {
    interface Global {
      CHILD_PROCESS_IDS: number[];
      AUTH_ID: string;
      AUTH_SERVER_URL: string;
      BASE_DIRECTORY: string;
      DEBUG_MODE: boolean;
      SERVER_ONLY_MODE: boolean;
      settingsDB: lowdb.LowdbSync<any>;
      tray: any;
      showApp: () => void;
    }
  }
}
export default global;
