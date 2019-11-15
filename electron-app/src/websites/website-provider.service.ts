import { Injectable } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { Weasyl } from './weasyl/weasyl.service';
import { Website } from './interfaces/website.interface';
import { WebsiteService } from './website.service';

@Injectable()
export class WebsiteProvider {
  private readonly websiteModules: Website[] = [];

  constructor(private moduleRef: ModuleRef, private readonly weasyl: Weasyl) {
    this.websiteModules = [...arguments].filter(arg => arg instanceof WebsiteService);
  }

  getWebsiteModule(name: string): Website {
      return this.moduleRef.get(name);
  }

  getAllWebsiteModules(): Website[] {
    return this.websiteModules;
  }
}
