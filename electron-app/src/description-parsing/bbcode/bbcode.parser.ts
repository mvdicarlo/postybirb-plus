import * as _ from 'lodash';

export class BBCodeParser {
  private static BLOCKS: string[] = ['p', 'div', 'pre', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6'];
  public static parse(html: string): string {
    if (!html) {
      return '';
    }

    // html = html.replace(/<h[1-7](.*?)>(.*?)<\/h[1-7]>/, '\n[h]$2[/h]\n');

    html = html.replace(/<b>/gi, '[b]');
    html = html.replace(/<i>/gi, '[i]');
    html = html.replace(/<u>/gi, '[u]');
    html = html.replace(/<s>/gi, '[s]');
    html = html.replace(/<\/b>/gi, '[/b]');
    html = html.replace(/<\/i>/gi, '[/i]');
    html = html.replace(/<\/u>/gi, '[/u]');
    html = html.replace(/<\/s>/gi, '[/s]');
    html = html.replace(/<em>/gi, '[i]');
    html = html.replace(/<\/em>/gi, '[/i]');
    html = html.replace(/<strong>/gi, '[b]');
    html = html.replace(/<\/strong>/gi, '[/b]');

    BBCodeParser.BLOCKS.forEach(block => {
      const regex = new RegExp(
        `<${block}(.*?)style="text-align:((left|right|center)?)"(.*?)>((.|\n)*?)<\/${block}>`,
        'gmi',
      );
      html = html.replace(regex, '[$3]$5[/$3]');

      const regex2 = new RegExp(`<${block}>\\s<\/${block}>`, 'gm');
      html = html.replace(regex2, '<br>');
    });

    html = BBCodeParser.postParse(html);

    html = html.replace(/<span style="color:(.*?)">((.|\n)*?)<\/span>/gim, '[color=$1]$2[/color]');

    html = html.replace(/<h[1-7](.*?)>(.*?)<\/h[1-7]>/, '$2\n');

    html = html.replace(/<br>/gi, '\n');
    html = html.replace(/<hr(.*?)>/gi, '\n[hr]\n');

    // opting to use \r for now
    html = html.replace(/<li(.*?)>(.*?)<\/li>/gi, '• $2\n');
    html = html.replace(/<ul(.*?)>/gi, '\n');
    html = html.replace(/<\/ul>/gi, '\n');
    html = html.replace(/<ol(.*?)>/gi, '\n');
    html = html.replace(/<\/ol>/gi, '\n');

    BBCodeParser.BLOCKS.forEach(block => {
      const regex1 = new RegExp(`</${block}>`, 'gmi');
      html = html.replace(regex1, '\n');

      const regex2 = new RegExp(`<${block}>`, 'gmi');
      html = html.replace(regex2, '');
    });

    html = html.replace(/<td(.*?)>/gi, ' ');
    html = html.replace(/<tr(.*?)>/gi, '\r');
    html = html.replace(/<a(.*?)href="(.*?)"(.*?)>(.*?)<\/a>/gi, '[url=$2]$4[/url]');

    html = html.replace(/<head>(.*?)<\/head>/gim, '');
    html = html.replace(/<object>(.*?)<\/object>/gim, '');
    html = html.replace(/<script(.*?)>(.*?)<\/script>/gim, '');
    html = html.replace(/<style(.*?)>(.*?)<\/style>/gim, '');
    html = html.replace(/<title>(.*?)<\/title>/gim, '');
    html = html.replace(/<!--(.*?)-->/gim, '\n');

    html = html.replace(/<(?:[^>'"]*|(['"]).*?\1)*>/gim, '');
    html = html.replace(/\r\r/gi, '');
    // html = html.replace(/(\S)\n/gi, '$1 ');
    html = _.unescape(html);
    html = html.replace(/&nbsp;/g, ' ');

    return html.trim();
  }

  private static postParse(html: string): string {
    if (!html) {
      return '';
    }

    html = html.replace(/(\n|\r)/g, '');

    const tags: string[] = ['b', 's', 'u', 'i'];
    tags.forEach(tag => {
      BBCodeParser.BLOCKS.forEach(block => {
        const regex = new RegExp(`\\[\/${tag}\\]<\/${block}><${block}>\\[${tag}\\]`, 'gmi');
        html = html.replace(regex, '\n');
      });
    });

    const blocks = ['left', 'right', 'center'];
    blocks.forEach(block => {
      const regex = new RegExp(`\\[\/${block}\\]\\[${block}\\]`, 'gmi');
      html = html.replace(regex, '\n');
    });

    return html;
  }
}
