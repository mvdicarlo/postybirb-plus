import { Controller, Post, Body, Get } from '@nestjs/common';
import { SettingsService } from './settings.service';
import { SettingsUpdateDto } from './settings.dto';

@Controller('settings')
export class SettingsController {
  constructor(private readonly service: SettingsService) {}

  @Get()
  getSettings() {
    return this.service.getSettings();
  }

  @Post()
  updateSetting(@Body() update: SettingsUpdateDto) {
    this.service.setValue(update.key, update.value);
  }
}
