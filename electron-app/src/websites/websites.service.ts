import { Injectable } from '@nestjs/common';
import { WebsiteProvider } from './website-provider.service';
import { UsernameShortcut } from './interfaces/username-shortcut.interface';

@Injectable()
export class WebsitesService {
  constructor(private readonly providers: WebsiteProvider) {}

  getUsernameShortcuts() {
    const shortcuts: { [key: string]: UsernameShortcut[] } = {};
    this.providers.getAllWebsiteModules().forEach(w => {
      if (w.usernameShortcuts.length) {
        shortcuts[w.constructor.name] = w.usernameShortcuts;
      }
    });
    return shortcuts;
  }
}
