import { Website } from './interfaces/website.interface';
import { Artconomy } from './artconomy/Artconomy';
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
import { HentaiFoundry } from './hentai-foundry/HentaiFoundry';
import { Aryion } from './aryion/Aryion';
import { Custom } from './custom/Custom';
import { Newgrounds } from './newgrounds/Newgrounds';
import { Pixiv } from './pixiv/Pixiv';
import { NewTumbl } from './new-tumbl/NewTumbl';
import { FurryLife } from './furry-life/FurryLife';
import { FurryNetwork } from './furry-network/FurryNetwork';
import { Patreon } from './patreon/Patreon';
import { Tumblr } from './tumblr/Tumblr';
import { DeviantArt } from './deviant-art/DeviantArt';
import { Mastodon } from './mastodon/Mastodon';
import { Twitter } from './twitter/Twitter';
import { Pillowfort } from './pillowfort/Pillowfort';
import { Telegram } from './telegram/Telegram';
import { Furbooru } from './furbooru/Furbooru';

export class WebsiteRegistry {
  static readonly websites: Record<string, Website> = {
    Artconomy: new Artconomy(),
    Aryion: new Aryion(),
    Custom: new Custom(),
    Derpibooru: new Derpibooru(),
    DeviantArt: new DeviantArt(),
    Discord: new Discord(),
    FurAffinity: new FurAffinity(),
    Furbooru: new Furbooru(),
    Furiffic: new Furiffic(),
    FurryLife: new FurryLife(),
    FurryNetwork: new FurryNetwork(),
    HentaiFoundry: new HentaiFoundry(),
    Inkbunny: new Inkbunny(),
    KoFi: new KoFi(),
    Mastodon: new Mastodon(),
    NewTumbl: new NewTumbl(),
    Newgrounds: new Newgrounds(),
    Patreon: new Patreon(),
    Piczel: new Piczel(),
    Pillowfort: new Pillowfort(),
    Pixiv: new Pixiv(),
    SoFurry: new SoFurry(),
    SubscribeStar: new SubscribeStar(),
    Telegram: new Telegram(),
    Tumblr: new Tumblr(),
    Twitter: new Twitter(),
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
