import { Module } from '@nestjs/common';
import { WebsiteProvider } from './website-provider.service';
import { WebsitesService } from './websites.service';
import { PiczelModule } from './piczel/piczel.module';
import { WeasylModule } from './weasyl/weasyl.module';
import { FurifficModule } from './furiffic/furiffic.module';
import { DiscordModule } from './discord/discord.module';
import { WebsitesController } from './websites.controller';
import { DerpibooruModule } from './derpibooru/derpibooru.module';
import { KoFiModule } from './ko-fi/ko-fi.module';
import { InkbunnyModule } from './inkbunny/inkbunny.module';
import { SoFurryModule } from './so-furry/so-furry.module';
import { E621Module } from './e621/e621.module';
import { FurAffinityModule } from './fur-affinity/fur-affinity.module';

@Module({
  controllers: [WebsitesController],
  providers: [WebsiteProvider, WebsitesService],
  exports: [WebsiteProvider, WebsitesService],
  imports: [
    PiczelModule,
    WeasylModule,
    FurifficModule,
    DiscordModule,
    DerpibooruModule,
    KoFiModule,
    InkbunnyModule,
    SoFurryModule,
    E621Module,
    FurAffinityModule,
  ],
})
export class WebsitesModule {}
