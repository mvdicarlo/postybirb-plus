import { Injectable, Logger } from '@nestjs/common';
import * as lowdb from 'lowdb';
import { SettingEvent } from './settings.events.enum';
import { Settings } from './settings.interface';
import { EventsGateway } from 'src/events/events.gateway';

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
    this.settings.set(setting, value).write();
    this.eventEmitter.emit(SettingEvent.UPDATED, this.settings.getState());
  }
}
