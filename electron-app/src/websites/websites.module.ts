import { Module } from '@nestjs/common';
import { WeasylController } from './weasyl/weasyl.controller';
import { Weasyl } from './weasyl/weasyl.service';
import { WebsiteProvider } from './website-provider.service';
import { DiscordController } from './discord/discord.controller';
import { Discord } from './discord/discord.service';

@Module({
  controllers: [WeasylController, DiscordController],
  providers: [Weasyl, WebsiteProvider, Discord],
  exports: [WebsiteProvider],
})
export class WebsitesModule {}
