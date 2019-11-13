import { Website } from './interfaces/website.interface';
import { Weasyl } from './weasyl/Weasyl';

export class WebsiteRegistry {
  static readonly websites: { [key: string]: Website } = {
    Weasyl: new Weasyl()
  };
}
