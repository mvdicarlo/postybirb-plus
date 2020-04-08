import { Injectable } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { Weasyl } from './weasyl/weasyl.service';
import { Website } from './website.base';
import { Discord } from './discord/discord.service';
import { Furiffic } from './furiffic/furiffic.service';

@Injectable()
export class WebsiteProvider {
  private readonly websiteModules: Website[] = [];

  constructor(private moduleRef: ModuleRef, readonly weasyl: Weasyl, readonly discord: Discord, readonly furiffic: Furiffic) {
    this.websiteModules = [...arguments].filter(arg => arg instanceof Website);
  }

  getWebsiteModule(name: string): Website {
    return this.moduleRef.get(name);
  }

  getAllWebsiteModules(): Website[] {
    return this.websiteModules;
  }
}
