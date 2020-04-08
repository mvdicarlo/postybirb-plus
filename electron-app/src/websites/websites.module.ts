import { Module } from '@nestjs/common';
import { WeasylController } from './weasyl/weasyl.controller';
import { Weasyl } from './weasyl/weasyl.service';
import { WebsiteProvider } from './website-provider.service';
import { DiscordController } from './discord/discord.controller';
import { Discord } from './discord/discord.service';
import { WebsitesController } from './websites.controller';
import { WebsitesService } from './websites.service';
import { Furiffic } from './furiffic/furiffic.service';
import { FurifficController } from './furiffic/furiffic.controller';

@Module({
  controllers: [WeasylController, DiscordController, WebsitesController, FurifficController],
  providers: [Weasyl, WebsiteProvider, Discord, WebsitesService, Furiffic],
  exports: [WebsiteProvider, WebsitesService],
})
export class WebsitesModule {}
