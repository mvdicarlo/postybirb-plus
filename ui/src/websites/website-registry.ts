import { Website } from './interfaces/website.interface';
import { Artconomy } from './artconomy/Artconomy';
import { Weasyl } from './weasyl/Weasyl';
import { Discord } from './discord/Discord';
import { Piczel } from './piczel/Piczel';
import { Derpibooru } from './derpibooru/Derpibooru';
import { KoFi } from './kofi/KoFi';
import { Inkbunny } from './inkbunny/Inkbunny';
import { SoFurry } from './sofurry/SoFurry';
import { e621 } from './e621/e621';
import { FurAffinity } from './fur-affinity/FurAffinity';
import { Furtastic } from './furtastic/furtastic';
import { SubscribeStar } from './subscribe-star/SubscribeStar';
import { HentaiFoundry } from './hentai-foundry/HentaiFoundry';
import { Aryion } from './aryion/Aryion';
import { Custom } from './custom/Custom';
import { Newgrounds } from './newgrounds/Newgrounds';
import { Pixiv } from './pixiv/Pixiv';
import { FurryLife } from './furry-life/FurryLife';
import { FurryNetwork } from './furry-network/FurryNetwork';
import { Patreon } from './patreon/Patreon';
import { Tumblr } from './tumblr/Tumblr';
import { DeviantArt } from './deviant-art/DeviantArt';
import { Manebooru } from './manebooru/Manebooru';
import { Mastodon } from './mastodon/Mastodon';
import { MissKey } from './misskey/MissKey';
import { Twitter } from './twitter/Twitter';
import { Pillowfort } from './pillowfort/Pillowfort';
import { Telegram } from './telegram/Telegram';
import { Furbooru } from './furbooru/Furbooru';
import { Itaku } from './itaku/Itaku';
import { Picarto } from './picarto/Picarto';
import { SubscribeStarAdult } from './subscribe-star/SubscribeStarAdult';
import { Pixelfed } from './pixelfed/Pixelfed';
import { Bluesky } from './bluesky/Bluesky';

export class WebsiteRegistry {
  static readonly websites: Record<string, Website> = {
    Artconomy: new Artconomy(),
    Aryion: new Aryion(),
    Bluesky: new Bluesky(),
    Custom: new Custom(),
    Derpibooru: new Derpibooru(),
    DeviantArt: new DeviantArt(),
    Discord: new Discord(),
    FurAffinity: new FurAffinity(),
    Furtastic: new Furtastic(),
    Furbooru: new Furbooru(),
    FurryNetwork: new FurryNetwork(),
    HentaiFoundry: new HentaiFoundry(),
    Inkbunny: new Inkbunny(),
    Itaku: new Itaku(),
    KoFi: new KoFi(),
    Manebooru: new Manebooru(),
    Mastodon: new Mastodon(),
    MissKey: new MissKey(),
    Newgrounds: new Newgrounds(),
    Patreon: new Patreon(),
    Picarto: new Picarto(),
    Piczel: new Piczel(),
    Pillowfort: new Pillowfort(),
    Pixelfed: new Pixelfed(),
    Pixiv: new Pixiv(),
    SoFurry: new SoFurry(),
    SubscribeStar: new SubscribeStar(),
    SubscribeStarAdult: new SubscribeStarAdult(),
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
