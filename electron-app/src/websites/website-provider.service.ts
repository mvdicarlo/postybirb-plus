import { Injectable } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { Weasyl } from './weasyl/weasyl.service';
import { Website } from './interfaces/website.interface';

@Injectable()
export class WebsiteProvider {
  constructor(private moduleRef: ModuleRef, private readonly weasyl: Weasyl) {}

  getWebsiteModule(name: string): Website {
      return this.moduleRef.get(name);
  }
}
