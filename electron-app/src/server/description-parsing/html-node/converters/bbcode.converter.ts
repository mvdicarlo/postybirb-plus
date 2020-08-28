import HtmlNode from '../html-node';
import { BBCodeConvertOptions } from '../convert-options.interface';
import { TagType } from '../tag-type.enum';
import { SpecialTag } from '../special-tag.enum';
import { BBCodeNodeConverter } from './bbcode-node-converter';

export class BBCodeConverter {
  static convert(node: HtmlNode, options?: BBCodeConvertOptions): string {
    switch (node.type) {
      case TagType.TEXT:
        return node.text;
      case TagType.SELF_CLOSED:
        if (node.tagName === SpecialTag.HR) {
          return options && options.altHR ? '\n------\n' : '[hr]';
        }
        return '';
      case TagType.STANDARD:
        const bbcodeNode = new BBCodeNodeConverter(node, options);
        return `${bbcodeNode.startTag}${node.children
          .map(child => ({
            child,
            text: BBCodeConverter.convert(child, options),
          }))
          .map(({ child, text }) => {
            if (child.isBlock) {
              return `${text}\n`;
            }

            return `${child.breakBefore ? `\n` : ''}${text}`;
          })
          .join('')}${bbcodeNode.endTag}`;
    }
  }
}
