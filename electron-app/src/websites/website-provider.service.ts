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
