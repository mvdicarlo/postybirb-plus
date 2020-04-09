import { Website } from './interfaces/website.interface';
import { Weasyl } from './weasyl/Weasyl';
import { Discord } from './discord/Discord';
import { Furiffic } from './furiffic/Furiffic';
import { Piczel } from './piczel/Piczel';

export class WebsiteRegistry {
  static readonly websites: Record<string, Website> = {
    Discord: new Discord(),
    Furiffic: new Furiffic(),
    Piczel: new Piczel(),
    Weasyl: new Weasyl()
  };

  static getAllAsArray() {
    return Object.values(WebsiteRegistry.websites).sort((a, b) => a.name.localeCompare(b.name));
  }
}
