import { Module } from '@nestjs/common';
import { TelegramController } from './telegram.controller';
import { Telegram } from './telegram.service';

@Module({
  controllers: [TelegramController],
  providers: [Telegram],
  exports: [Telegram],
})
export class TelegramModule {}
