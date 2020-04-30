import { Injectable } from '@nestjs/common';
import { Weasyl } from './weasyl/weasyl.service';
import { Website } from './website.base';
import { Discord } from './discord/discord.service';
import { Furiffic } from './furiffic/furiffic.service';
import { Piczel } from './piczel/piczel.service';
import { Derpibooru } from './derpibooru/derpibooru.service';
import { KoFi } from './ko-fi/ko-fi.service';
import { Inkbunny } from './inkbunny/inkbunny.service';
import { SoFurry } from './so-furry/so-furry.service';
import { e621 } from './e621/e621.service';
import { FurAffinity } from './fur-affinity/fur-affinity.service';
import { SubscribeStar } from './subscribe-star/subscribe-star.service';
import { Route50 } from './route50/route50.service';
import { HentaiFoundry } from './hentai-foundry/hentai-foundry.service';
import { Aryion } from './aryion/aryion.service';
import { Custom } from './custom/custom.service';
import { Newgrounds } from './newgrounds/newgrounds.service';
import { Pixiv } from './pixiv/pixiv.service';
import { NewTumbl } from './new-tumbl/new-tumbl.service';

@Injectable()
export class WebsiteProvider {
  private readonly websiteModules: Website[] = [];
  private readonly websiteModulesMap: Record<string, Website> = {};

  constructor(
    readonly weasyl: Weasyl,
    readonly discord: Discord,
    readonly furiffic: Furiffic,
    readonly piczel: Piczel,
    readonly derpibooru: Derpibooru,
    readonly kofi: KoFi,
    readonly inkbunny: Inkbunny,
    readonly sofurry: SoFurry,
    readonly e621: e621,
    readonly furaffinity: FurAffinity,
    readonly subscribestar: SubscribeStar,
    readonly route50: Route50,
    readonly hentaiFoundry: HentaiFoundry,
    readonly aryion: Aryion,
    readonly custom: Custom,
    readonly newgrounds: Newgrounds,
    readonly pixiv: Pixiv,
    readonly newTumbl: NewTumbl,
  ) {
    this.websiteModules = [...arguments].filter(arg => arg instanceof Website);
    this.websiteModules.forEach(
      website => (this.websiteModulesMap[website.constructor.name.toLowerCase()] = website),
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
}
