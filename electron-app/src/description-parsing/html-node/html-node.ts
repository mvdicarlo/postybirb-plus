import { TagType } from './tag-type.enum';
import { SpecialTag } from './special-tag.enum';

export default class HtmlNode {
  public parent: HtmlNode;
  public tagName: string;
  public children: HtmlNode[];
  public fragment: string;
  public type: TagType;
  public styles: Record<string, string>;
  public text: string;
  public level: number;
  public href: string;
  public classes: string[];
  public breakBefore: boolean;

  get isBlock(): boolean {
    return ['p', 'div', 'pre', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'br', 'hr'].includes(
      this.tagName,
    );
  }

  constructor(parent: HtmlNode, fragment: string | HtmlNode, level?: number) {
    // Copy
    if (fragment instanceof HtmlNode) {
      this.parent = parent;
      this.tagName = fragment.tagName;
      this.href = fragment.href;
      this.type = fragment.type;
      this.text = fragment.text;
      this.level = fragment.level;
      this.classes = [...fragment.classes];
      this.fragment = fragment.fragment;
      this.styles = Object.assign({}, fragment.styles);
      this.breakBefore = fragment.breakBefore;
      this.children = fragment.children.map(c => new HtmlNode(this, c));
    } else {
      this.parent = parent;
      this.level = level || 0;
      this.children = [];
      this.styles = {};
      this.classes = [];
      this.fragment = fragment;
      this.findNodeTag();
      this.findChildren();
    }
  }

  private findChildren() {
    switch (this.type) {
      case TagType.TEXT:
        const endOfTextIndex = this.fragment.indexOf('<');
        this.text =
          endOfTextIndex === -1 ? this.fragment : this.fragment.substring(0, endOfTextIndex);
        break;
      case TagType.STANDARD:
        let newFragment = this.fragment.replace(/^<(.*?)>/, '');
        const endOfTagIndex = newFragment.lastIndexOf(`</${this.tagName}>`);
        if (endOfTagIndex === -1) {
          throw new Error('Invalid HTML at ' + this.fragment);
        }
        newFragment = newFragment.substring(0, endOfTagIndex);
        this.findChildSegments(newFragment).forEach((s: string) => {
          this.children.push(new HtmlNode(this, s, this.level + 1));
        });
        break;
    }
  }

  private findNodeTag() {
    if (this.fragment.startsWith('<')) {
      const [tag, tagPart] = this.fragment.match(/^<(.*?)>/);
      this.type = tag.endsWith('/>') ? TagType.SELF_CLOSED : TagType.STANDARD;
      this.tagName = tagPart.match(/^[a-z0-9]*/)[0];
      this.findStyles(tag);
      if (this.tagName === SpecialTag.A) {
        this.findHref(tag);
      }
    } else {
      this.tagName = SpecialTag.TEXT;
      this.type = TagType.TEXT;
    }
  }

  private findStyles(nodeTag: string) {
    const matchStyles = nodeTag.match(/style="(.*?)"/);
    if (matchStyles) {
      matchStyles[1]
        .split(';')
        .filter(style => style)
        .map(style => {
          const [prop, value] = style.split(':');
          return { prop: prop.trim(), value: value.trim() };
        })
        .forEach(({ prop, value }) => (this.styles[prop] = value));
    }
  }

  private findHref(nodeTag: string) {
    const href = nodeTag.match(/href="(.*?)"/);
    if (href) {
      this.href = href[1].trim();
    }
  }

  private findChildSegments(html: string) {
    const segments = [];
    while (true) {
      const { segment, truncated } = this.findNextSegment(html);
      segments.push(segment);
      html = truncated;
      if (!segment) {
        break;
      }
    }
    return segments.filter(s => s);
  }

  private findNextSegment(html: string) {
    let segment = null;
    let truncated = html;
    if (html.startsWith('<')) {
      const tag = html.match(/^<(.*?)>/);
      if (tag) {
        if (tag[0].endsWith('/>')) {
          segment = tag[0];
          truncated = html.substring(segment.length);
        } else {
          const tagName = tag[0].match(/^<[a-z0-9]*/)[0].replace('<', '');
          const openMatcher = new RegExp(`<${tagName}(.*?)>`);
          const closedMatcher = new RegExp(`</${tagName}>`);
          let openCount = 1;
          let builder = tag[0];
          let htmlSearcher = html.substring(tag[0].length, html.length);
          while (openCount !== 0) {
            const match = htmlSearcher.match(openMatcher);
            const match2 = htmlSearcher.match(closedMatcher);
            if (match2 && match && match2.index < match.index) {
              builder = builder.concat(htmlSearcher.substring(0, match2.index + match2[0].length));
              htmlSearcher = htmlSearcher.substring(match2.index + match2[0].length);
              break;
            }

            if (match) {
              openCount += 1;
              builder = builder.concat(htmlSearcher.substring(0, match[0].length));
              htmlSearcher = htmlSearcher.substring(match[0].length);
            }

            if (!match2) {
              throw new Error('No matching end tag found for ' + tagName);
            }

            openCount -= 1;
            builder = builder.concat(htmlSearcher.substring(0, match2.index + match2[0].length));
            htmlSearcher = htmlSearcher.substring(match2.index + match2[0].length);
          }

          truncated = htmlSearcher;
          segment = builder;
        }
      }
    } else {
      const index = html.indexOf('<');
      if (index !== -1) {
        segment = html.substring(0, index);
        truncated = html.substring(index, html.length);
      } else {
        segment = html;
        truncated = '';
      }
    }

    return { truncated, segment };
  }

  public nextChild(node: HtmlNode): HtmlNode {
    return this.children.slice(this.children.lastIndexOf(node) + 1)[0];
  }

  protected replaceChild(replacer: HtmlNode, replacee: HtmlNode) {
    this.children[this.children.indexOf(replacee)] = replacer;
  }

  // Compares styles, type, tagname
  public isWeaklyEqual(node: HtmlNode): boolean {
    if (!node) {
      return false;
    }

    if (!(node instanceof HtmlNode)) {
      return false;
    }

    if (this.tagName !== node.tagName) {
      return false;
    }

    if (this.type !== node.type) {
      return false;
    }

    // Closed tags are considered unique
    if (this.type == TagType.SELF_CLOSED) {
      return false;
    }

    if (this.href !== node.href) {
      return false;
    }

    if (this.styles && node.styles) {
      if (Object.keys(this.styles).length !== Object.keys(node.styles).length) {
        return false;
      }
      for (const key in this.styles) {
        if (this.styles[key] !== node.styles[key]) {
          return false;
        }
      }
    } else {
      return false;
    }

    return true;
  }

  public convertTag(from: string, to: string) {
    if (this.tagName === from) {
      this.tagName = to;
    }

    this.children.forEach(child => child.convertTag(from, to));
  }

  public createClasses(classCreator: (tag: string, style: string, value: string) => string) {
    this.classes = Object.entries(this.styles).map(([style, value]) =>
      classCreator(this.tagName, style, value),
    );
    this.children.forEach(child => child.createClasses(classCreator));
  }

  public collapseSimilarTags(onStyleOnly?: boolean) {
    for (let i = 0; i < this.children.length; i++) {
      this.children[i].collapseSimilarTags(onStyleOnly);
    }

    if (this.parent) {
      let next = this.parent.nextChild(this);
      if (onStyleOnly) {
        if (this.isWeaklyEqual(next)) {
          if (
            next.isBlock &&
            this.isBlock &&
            Object.keys(next.styles).length &&
            Object.keys(this.styles).length
          ) {
            next.parent = null;
            next.children.forEach(child => {
              child.parent = this;
              child.breakBefore = true;
              this.children.push(child);
            });
            this.fragment += next.fragment;
            this.parent.replaceChild(this, next);
          }
        }
      } else {
        if (this.isWeaklyEqual(next)) {
          next.parent = null;
          next.children.forEach(child => {
            child.parent = this;
            child.breakBefore = true;
            this.children.push(child);
          });
          if (next.type === TagType.TEXT) {
            this.text += `\n${next.text}`;
          }
          this.fragment += next.fragment;
          this.parent.replaceChild(this, next);
        }
      }
    }

    const uniqueChildren = [];
    this.children.forEach(child => {
      if (!uniqueChildren.includes(child)) {
        uniqueChildren.push(child);
      }
    });
    this.children = uniqueChildren;
  }

  public removeUnallowedStyles(allowedStyles: string[]) {
    Object.keys(this.styles)
      .filter(key => !allowedStyles.includes[key])
      .forEach(style => delete this.styles[style]);
    this.children.forEach(child => child.removeUnallowedStyles(allowedStyles));
  }
}
