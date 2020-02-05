import HtmlNode from '../html-node';
import { BBCodeConvertOptions } from '../convert-options.interface';

export class BBCodeNodeConverter {
  public endTag: string = '';
  public startTag: string = '';

  constructor(private node: HtmlNode, private options?: BBCodeConvertOptions) {
    this.convert();
  }

  private convert() {
    let isBlock: boolean = this.node.isBlock;
    let isAligned: boolean = false;
    if (this.node.styles['text-align']) {
      isBlock = true;
      isAligned = true;
    }

    if (isBlock) {
      if (isAligned) {
        this.startTag = `[${this.node.styles['text-align']}]`;
        this.endTag = `[/${this.node.styles['text-align']}]`;
      } else {
        if (this.options && this.options.replaceBlockWith) {
          this.startTag = `[${this.options.replaceBlockWith}]`;
          this.endTag = `[/${this.options.replaceBlockWith}]`;
        }
      }
    }

    if (this.node.href) {
      this.startTag += `[url=${this.node.href}]`;
      this.endTag = `[/url]${this.endTag}`;
    }

    if (this.node.styles.color) {
      this.startTag += `[color=${this.node.styles.color}]`;
      this.endTag = `[/color]${this.endTag}`;
    }

    switch (this.node.tagName) {
      case 'em':
      case 'i':
        this.startTag += '[i]';
        this.endTag = `[/i]${this.endTag}`;
        break;
      case 'strong':
      case 'b':
        this.startTag += '[b]';
        this.endTag = `[/b]${this.endTag}`;
        break;
      case 's':
        this.startTag += '[s]';
        this.endTag = `[/s]${this.endTag}`;
        break;
      case 'u':
        this.startTag += '[u]';
        this.endTag = `[/u]${this.endTag}`;
        break;
    }
  }
}
