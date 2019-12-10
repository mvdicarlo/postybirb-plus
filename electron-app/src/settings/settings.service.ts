import { Injectable } from '@nestjs/common';
import * as lowdb from 'lowdb';
import { SettingEvent } from './enums/settings.events.enum';
import { Settings } from './interfaces/settings.interface';
import { EventsGateway } from 'src/events/events.gateway';
import { AppGlobal } from 'src/app-global.interface';

@Injectable()
export class SettingsService {
  private readonly settings: lowdb.LowdbSync<Settings> = (global as AppGlobal).settingsDB;

  constructor(private readonly eventEmitter: EventsGateway) {}

  getSettings(): Settings {
    return this.settings.getState();
  }

  getValue<T>(setting: keyof Settings): T {
    return this.settings.get<any>(setting).value();
  }

  setValue(setting: keyof Settings, value: any): void {
    this.settings.set(setting, value).write();
    this.eventEmitter.emit(SettingEvent.UPDATED, this.settings.getState());
  }
}
