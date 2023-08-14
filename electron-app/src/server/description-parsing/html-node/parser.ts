import HtmlNode from './html-node';
import _ from 'lodash';
import { ConvertOptions } from './convert-options.interface';
import { HtmlConverter } from './converters/html.converter';
import { BBCodeConverter } from './converters/bbcode.converter';
import { MarkdownConverter } from './converters/markdown.converter';
import { PlainConverter } from './converters/plain.converter';

type ConvertType = 'html' | 'plain' | 'bbcode' | 'markdown' | 'custom';

export default class HtmlParser {
  static parse(html: string) {
    if (!html) {
      throw new Error('No html provided to parse.');
    }

    return new HtmlNode(
      null,
      '<root>' +
        html
          .replace(/<\!DOCTYPE html>/gi, '')
          .replace(/[\r\n\t\f\v]/g, '')
          .replace(/<(p|div)>\s<\/(p|div)>/g, '<br />')
          .replace(/(<br\/>|<br>)/, '<br />')
          .replace(/(<hr\/>|<hr>)/, '<hr />')
          .replace(/<!--(.*?)-->/gim, '')
          .replace(/<head>(.*?)<\/head>/gim, '')
          .replace(/<object>(.*?)<\/object>/gim, '')
          .replace(/<script(.*?)>(.*?)<\/script>/gim, '')
          .replace(/<style(.*?)>(.*?)<\/style>/gim, '')
          .replace(/<title>(.*?)<\/title>/gim, '')
          .replace(/<meta>(.*?)<\/meta>/gim, '')
          .trim() +
        '</root>',
    );
  }

  static convert(node: HtmlNode, type: ConvertType, options?: ConvertOptions): string {
    if (!node) {
      throw new Error('No node provided');
    }

    const copy = new HtmlNode(null, node);

    options = options || {};
    if (options.allowedStyles) {
      copy.removeUnallowedStyles(options.allowedStyles);
    }

    if (options.convertTag) {
      Object.entries(options.convertTag).forEach(([from, to]) => copy.convertTag(from, to));
    }

    if (options.classCreator) {
      copy.createClasses(options.classCreator);
    }

    if (options.collapseSimilarTags !== false) {
      // defaults true
      copy.collapseSimilarTags(options.collapseOnStyleOnly || type === 'bbcode');
    }

    switch (type) {
      case 'html':
        return HtmlConverter.convert(copy)
          .replace(/(<root>|<\/root>)/g, '')
          .trim();
      case 'bbcode':
        return _.unescape(BBCodeConverter.convert(copy, options.bbcode));
      case 'markdown':
        return MarkdownConverter.convert(copy.fragment);
      case 'plain':
        return _.unescape(PlainConverter.convert(node, options.hrefParser));
      case 'custom':
        return options.customParser(node, options);
    }

    return '';
  }
}
