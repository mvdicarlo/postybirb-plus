import { Body, Controller, Post } from '@nestjs/common';
import { TelegramAccountData } from 'postybirb-commons';
import { GenericWebsiteController } from '../generic/generic.controller';
import { Telegram } from './telegram.service';

@Controller('telegram')
export class TelegramController extends GenericWebsiteController {
  constructor(protected readonly service: Telegram) {
    super(service);
  }

  @Post('authenticate')
  async authenticate(@Body() data: { appId: string; code: string, password: string }) {
    return this.service.authenticate(data);
  }

  @Post('startAuthentication')
  async startAuthentication(@Body() data: TelegramAccountData) {
    return this.service.startAuthentication(data);
  }
}
