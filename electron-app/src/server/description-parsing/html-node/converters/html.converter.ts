import HtmlNode from '../html-node';
import { TagType } from '../tag-type.enum';

export class HtmlConverter {
  private static getStyleString(styles: Record<string, string>): string {
    return `${Object.entries(styles)
      .map(([style, value]) => `${style}:${value}`)
      .join('; ')}`;
  }

  static convert(node: HtmlNode) {
    const depth = '  '.repeat(Math.max(0, node.level - 1));
    const styleString = HtmlConverter.getStyleString(node.styles);
    switch (node.type) {
      case TagType.TEXT:
        return `${depth}${node.breakBefore ? `<br />\n${depth}` : ''}${node.text.replace(
          /\n/g,
          `\n${depth}<br />\n${depth}`,
        )}`;
      case TagType.SELF_CLOSED:
        let val = `${depth}<${node.tagName}`;
        if (node.classes.length) {
          val += ` class="${node.classes.join(' ')}"`;
        }

        if (styleString) {
          val += ` style="${styleString}"`;
        }
        return `${val} />`;
      case TagType.STANDARD:
        let standardVal = `${depth}<${node.tagName}`;
        if (node.classes.length) {
          standardVal += ` class="${node.classes.join(' ')}"`;
        }

        if (styleString) {
          standardVal += ` style="${styleString}"`;
        }

        if (node.href) {
          standardVal += ` href="${node.href}" target="_blank"`;
        }

        return `${node.breakBefore ? `${depth}<br />\n` : ''}${standardVal}>\n${node.children
          .map(child => HtmlConverter.convert(child).trimEnd())
          .join('\n')}\n${depth}</${node.tagName}>`;
    }
  }
}
