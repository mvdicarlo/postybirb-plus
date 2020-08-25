import { Module } from '@nestjs/common';
import { Discord } from './discord.service';

@Module({
  providers: [Discord],
  exports: [Discord],
})
export class DiscordModule {}
