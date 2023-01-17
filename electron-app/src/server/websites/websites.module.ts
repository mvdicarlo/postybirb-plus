import { Module } from '@nestjs/common';
import { WebsiteProvider } from './website-provider.service';
import { WebsitesService } from './websites.service';
import { ArtconomyModule } from './artconomy/artconomy.module';
import { PiczelModule } from './piczel/piczel.module';
import { WeasylModule } from './weasyl/weasyl.module';
import { DiscordModule } from './discord/discord.module';
import { WebsitesController } from './websites.controller';
import { DerpibooruModule } from './derpibooru/derpibooru.module';
import { KoFiModule } from './ko-fi/ko-fi.module';
import { InkbunnyModule } from './inkbunny/inkbunny.module';
import { SoFurryModule } from './so-furry/so-furry.module';
import { E621Module } from './e621/e621.module';
import { FurAffinityModule } from './fur-affinity/fur-affinity.module';
import { SubscribeStarModule } from './subscribe-star/subscribe-star.module';
import { HentaiFoundryModule } from './hentai-foundry/hentai-foundry.module';
import { AryionModule } from './aryion/aryion.module';
import { CustomModule } from './custom/custom.module';
import { NewgroundsModule } from './newgrounds/newgrounds.module';
import { PixivModule } from './pixiv/pixiv.module';
import { NewTumblModule } from './new-tumbl/new-tumbl.module';
import { FurryLifeModule } from './furry-life/furry-life.module';
import { FurryNetworkModule } from './furry-network/furry-network.module';
import { PatreonModule } from './patreon/patreon.module';
import { TumblrModule } from './tumblr/tumblr.module';
import { DeviantArtModule } from './deviant-art/deviant-art.module';
import { ManebooruModule } from './manebooru/manebooru.module';
import { MastodonModule } from './mastodon/mastodon.module';
import { TwitterModule } from './twitter/twitter.module';
import { PillowfortModule } from './pillowfort/pillowfort.module';
import { TelegramModule } from './telegram/telegram.module';
import { FurbooruModule } from './furbooru/furbooru.module';
import { ItakuModule } from './itaku/itaku.module';
import { PicartoModule } from './picarto/picarto.module';
import { SubscribeStarAdultModule } from './subscribe-star-adult/subscribe-star-adult.module';

@Module({
  controllers: [WebsitesController],
  providers: [WebsiteProvider, WebsitesService],
  exports: [WebsiteProvider, WebsitesService],
  imports: [
    ArtconomyModule,
    AryionModule,
    CustomModule,
    DerpibooruModule,
    DeviantArtModule,
    DiscordModule,
    E621Module,
    FurAffinityModule,
    FurbooruModule,
    FurryLifeModule,
    FurryNetworkModule,
    HentaiFoundryModule,
    InkbunnyModule,
    KoFiModule,
    ManebooruModule,
    MastodonModule,
    NewTumblModule,
    NewgroundsModule,
    PatreonModule,
    PiczelModule,
    PillowfortModule,
    PixivModule,
    SoFurryModule,
    SubscribeStarModule,
    SubscribeStarAdultModule,
    TelegramModule,
    TumblrModule,
    TwitterModule,
    WeasylModule,
    ItakuModule,
    PicartoModule,
  ],
})
export class WebsitesModule {}
