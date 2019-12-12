import { Website } from './interfaces/website.interface';
import { Weasyl } from './weasyl/Weasyl';
import { Discord } from './discord/Discord';

export class WebsiteRegistry {
  static readonly websites: { [key: string]: Website } = {
    Discord: new Discord(),
    Weasyl: new Weasyl()
  };
}
