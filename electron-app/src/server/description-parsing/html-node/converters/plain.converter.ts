import HtmlNode from '../html-node';
import { TagType } from '../tag-type.enum';
import { SpecialTag } from '../special-tag.enum';

type HrefParser = (text: string, href: string) => string;

export class PlainConverter {
  static defaultHrefParser(text: string, href: string) {
    return text === href ? href : `${text} ( ${href} )`;
  }

  static convert(node: HtmlNode, hrefParser?: HrefParser): string {
    switch (node.type) {
      case TagType.TEXT:
        return node.text;
      case TagType.SELF_CLOSED:
        if (node.tagName === SpecialTag.HR) {
          return '\n------\n';
        }
        return '';
      case TagType.STANDARD:
        const hrefFn = hrefParser || PlainConverter.defaultHrefParser;
        if (node.tagName === SpecialTag.A) {
          return hrefFn(
            node.children
              .map(child => PlainConverter.convert(child, hrefParser))
              .join('\n')
              .trim(),
            node.href,
          );
        }
        return node.children
          .map(child => ({
            child,
            text: PlainConverter.convert(child, hrefParser),
          }))
          .map(({ child, text }) => {
            if (child.isBlock) {
              return `${text}\n`;
            }
            return text;
          })
          .join('');
    }
  }
}
