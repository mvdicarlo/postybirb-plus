import { readJSONSync, writeJSON, ensureDirSync } from 'fs-extra';
import { join } from 'path';
import { BASE_DIRECTORY } from 'src/server/directories';

ensureDirSync(join(BASE_DIRECTORY, 'auth', 'telegram'));

// For use with @mtproto
export class TelegramStorage {
  private storage: any;
  private name: string;

  constructor(name: string) {
    this.name = name;
    this.storage = {};
    try {
      // NOTE: Don't really want to use sync here, but don't want to set up a promise wait
      this.storage = readJSONSync(this.getFileName());
    } catch (err) {
      console.error(err);
    }
  }

  private getFileName() {
    return join(BASE_DIRECTORY, 'auth', 'telegram', `${this.name}.json`);
  }

  get(key: string): Promise<any> {
    return this.storage[key];
  }

  set(key: string, value: any): Promise<any> {
    this.storage[key] = value;
    return writeJSON(this.getFileName(), this.storage, { spaces: 1 }).then(() => this.storage[key]);
  }
}
