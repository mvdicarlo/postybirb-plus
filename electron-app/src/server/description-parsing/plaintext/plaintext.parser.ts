import _ from 'lodash';
import cheerio from 'cheerio';

export class PlaintextParser {
  public static parse(html: string, linkLength?: number): string {
    if (!html) {
      return '';
    }

    html = html.replace(/<br(\/|\s\/){0,1}>/g, '<br>');
    html = html.replace(/<br>\n/gi, '<br>');
    html = html.replace(/<br>/gi, '\n');
    html = html.replace(/<hr(.*?)>/gi, '\n------------\n');

    let next = null;
    while ((next = html.match(/<a(.*?)href="(.*?)">(.*?)<\/a>/))) {
      const url = linkLength ? next[2].substring(0, linkLength) : next[2];
      html = html.replace(next[0], url);
    }

    const $ = cheerio.load('');
    return $(html).text().trim();
  }
}
