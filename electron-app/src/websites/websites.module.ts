import { Module } from '@nestjs/common';
import { WebsiteProvider } from './website-provider.service';
import { WebsitesService } from './websites.service';
import { PiczelModule } from './piczel/piczel.module';
import { WeasylModule } from './weasyl/weasyl.module';
import { FurifficModule } from './furiffic/furiffic.module';
import { DiscordModule } from './discord/discord.module';
import { WebsitesController } from './websites.controller';
import { DerpibooruModule } from './derpibooru/derpibooru.module';

@Module({
  controllers: [WebsitesController],
  providers: [WebsiteProvider, WebsitesService],
  exports: [WebsiteProvider, WebsitesService],
  imports: [PiczelModule, WeasylModule, FurifficModule, DiscordModule, DerpibooruModule],
})
export class WebsitesModule {}
