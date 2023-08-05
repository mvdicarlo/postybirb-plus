import { Injectable } from '@nestjs/common';
import { Artconomy } from './artconomy/artconomy.service';
import { Weasyl } from './weasyl/weasyl.service';
import { Website } from './website.base';
import { Discord } from './discord/discord.service';
import { Piczel } from './piczel/piczel.service';
import { Derpibooru } from './derpibooru/derpibooru.service';
import { KoFi } from './ko-fi/ko-fi.service';
import { Inkbunny } from './inkbunny/inkbunny.service';
import { SoFurry } from './so-furry/so-furry.service';
import { e621 } from './e621/e621.service';
import { FurAffinity } from './fur-affinity/fur-affinity.service';
import { SubscribeStar } from './subscribe-star/subscribe-star.service';
import { HentaiFoundry } from './hentai-foundry/hentai-foundry.service';
import { Aryion } from './aryion/aryion.service';
import { Custom } from './custom/custom.service';
import { Newgrounds } from './newgrounds/newgrounds.service';
import { Pixiv } from './pixiv/pixiv.service';
import { FurryLife } from './furry-life/furry-life.service';
import { FurryNetwork } from './furry-network/furry-network.service';
import { Patreon } from './patreon/patreon.service';
import { Tumblr } from './tumblr/tumblr.service';
import { DeviantArt } from './deviant-art/deviant-art.service';
import { Manebooru } from './manebooru/manebooru.service';
import { Mastodon } from './mastodon/mastodon.service';
import { Twitter } from './twitter/twitter.service';
import { Pillowfort } from './pillowfort/pillowfort.service';
import { Telegram } from './telegram/telegram.service';
import { Furbooru } from './furbooru/furbooru.service';
import { Itaku } from './itaku/itaku.service';
import { Picarto } from './picarto/picarto.service';
import { SubscribeStarAdult } from './subscribe-star-adult/subscribe-star-adult.service';
import { Pixelfed } from './pixelfed/pixelfed.service';
import { MissKey } from './misskey/misskey.service';

@Injectable()
export class WebsiteProvider {
  private readonly websiteModules: Website[] = [];
  private readonly websiteModulesMap: Record<string, Website> = {};

  constructor(
    readonly artconomy: Artconomy,
    readonly weasyl: Weasyl,
    readonly discord: Discord,
    readonly piczel: Piczel,
    readonly derpibooru: Derpibooru,
    readonly kofi: KoFi,
    readonly inkbunny: Inkbunny,
    readonly sofurry: SoFurry,
    readonly e621: e621,
    readonly furaffinity: FurAffinity,
    readonly subscribestar: SubscribeStar,
    readonly subscribestarAdult: SubscribeStarAdult,
    readonly hentaiFoundry: HentaiFoundry,
    readonly aryion: Aryion,
    readonly custom: Custom,
    readonly newgrounds: Newgrounds,
    readonly pixiv: Pixiv,
    readonly furryNetwork: FurryNetwork,
    readonly patreon: Patreon,
    readonly tumblr: Tumblr,
    readonly deviantArt: DeviantArt,
    readonly manebooru: Manebooru,
    readonly mastodon: Mastodon,
    readonly misskey: MissKey,
    readonly twitter: Twitter,
    readonly pillowfort: Pillowfort,
    readonly telegram: Telegram,
    readonly furbooru: Furbooru,
    readonly itaku: Itaku,
    readonly picarto: Picarto,
    readonly pixelfed: Pixelfed,
  ) {
    this.websiteModules = [...arguments].filter((arg) => arg instanceof Website);
    this.websiteModules.forEach(
      (website) => (this.websiteModulesMap[website.constructor.name.toLowerCase()] = website),
    );
  }

  getWebsiteModule(name: string): Website {
    const module = this.websiteModulesMap[name.toLocaleLowerCase()];
    if (!module) {
      throw new Error(`Could not find ${name} module`);
    }
    return module;
  }

  getAllWebsiteModules(): Website[] {
    return this.websiteModules;
  }

  websiteModuleExists(name: string): boolean {
    return !!this.websiteModulesMap[name.toLocaleLowerCase()];
  }
}
