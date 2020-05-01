import { Website } from './interfaces/website.interface';
import { Weasyl } from './weasyl/Weasyl';
import { Discord } from './discord/Discord';
import { Furiffic } from './furiffic/Furiffic';
import { Piczel } from './piczel/Piczel';
import { Derpibooru } from './derpibooru/Derpibooru';
import { KoFi } from './kofi/KoFi';
import { Inkbunny } from './inkbunny/Inkbunny';
import { SoFurry } from './sofurry/SoFurry';
import { e621 } from './e621/e621';
import { FurAffinity } from './fur-affinity/FurAffinity';
import { SubscribeStar } from './subscribe-star/SubscribeStar';
import { Route50 } from './route-50/Route50';
import { HentaiFoundry } from './hentai-foundry/HentaiFoundry';
import { Aryion } from './aryion/Aryion';
import { Custom } from './custom/Custom';
import { Newgrounds } from './newgrounds/Newgrounds';
import { Pixiv } from './pixiv/Pixiv';
import { NewTumbl } from './new-tumbl/NewTumbl';
import { FurryLife } from './furry-life/FurryLife';

export class WebsiteRegistry {
  static readonly websites: Record<string, Website> = {
    Aryion: new Aryion(),
    Custom: new Custom(),
    Derpibooru: new Derpibooru(),
    Discord: new Discord(),
    FurAffinity: new FurAffinity(),
    Furiffic: new Furiffic(),
    FurryLife: new FurryLife(),
    HentaiFoundry: new HentaiFoundry(),
    Inkbunny: new Inkbunny(),
    KoFi: new KoFi(),
    Newgrounds: new Newgrounds(),
    NewTumbl: new NewTumbl(),
    Piczel: new Piczel(),
    Pixiv: new Pixiv(),
    Route50: new Route50(),
    SoFurry: new SoFurry(),
    SubscribeStar: new SubscribeStar(),
    Weasyl: new Weasyl(),
    e621: new e621()
  };

  static getAllAsArray() {
    return Object.values(WebsiteRegistry.websites).sort((a, b) => a.name.localeCompare(b.name));
  }

  static find(website: string): Website | undefined {
    const search = website.toLowerCase();
    return Object.values(WebsiteRegistry.websites).find(
      w => w.name.toLowerCase() === search || w.internalName.toLowerCase() === search
    );
  }
}
