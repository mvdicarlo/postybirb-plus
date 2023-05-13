import { app } from 'electron';
import { Injectable, Logger } from '@nestjs/common';
import lowdb from 'lowdb';
import { Events } from 'postybirb-commons';
import { Settings } from 'postybirb-commons';
import { EventsGateway } from 'src/server/events/events.gateway';

@Injectable()
export class SettingsService {
  private readonly logger = new Logger(SettingsService.name);
  private readonly settings: lowdb.LowdbSync<Settings> = global.settingsDB;

  constructor(private readonly eventEmitter: EventsGateway) {}

  getSettings(): Settings {
    return this.settings.getState();
  }

  getValue<T>(setting: keyof Settings): T {
    return this.settings.get<any>(setting).value();
  }

  setValue(setting: keyof Settings, value: any): void {
    this.logger.debug(`${setting} -> ${value}`, 'Update Setting');

    if (setting === 'openOnLogin') {
      app.setLoginItemSettings({
        openAtLogin: value,
        path: app.getPath('exe'),
      });
    }

    this.settings.set(setting, value).write();
    this.eventEmitter.emit(Events.SettingEvent.UPDATED, this.settings.getState());
  }
}
