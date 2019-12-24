import { Module } from '@nestjs/common';
import { WeasylController } from './weasyl/weasyl.controller';
import { Weasyl } from './weasyl/weasyl.service';
import { WebsiteProvider } from './website-provider.service';
import { DiscordController } from './discord/discord.controller';
import { Discord } from './discord/discord.service';
import { WebsitesController } from './websites.controller';
import { WebsitesService } from './websites.service';

@Module({
  controllers: [WeasylController, DiscordController, WebsitesController],
  providers: [Weasyl, WebsiteProvider, Discord, WebsitesService],
  exports: [WebsiteProvider],
})
export class WebsitesModule {}
