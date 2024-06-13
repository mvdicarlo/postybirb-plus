import cheerio from 'cheerio';

type TelegramEntityParser = ({ node, output }: { node: cheerio.TagElement; output: string }) => any;

export class TelegramDescription {
  /**
   * Map of telegram entites to html tags
   */
  private static mappers: Record<string, TelegramEntityParser> = {};

  /**
   * Creates html tag to telegram entity mapper
   */
  private static map(type: string, tags: string[], parse?: TelegramEntityParser) {
    parse ??= ({ node, output }) => {
      return {
        _: `messageEntity${type}`,
        offset: output.length,
        length: 0,
      };
    };

    for (const tag of tags) {
      this.mappers[tag] = parse;
    }

    return parse;
  }

  static {
    this.map('Bold', ['b', 'strong']);
    this.map('Underline', ['u', 'ins']);
    this.map('Strike', ['s', 'strike', 'del']);
    this.map('Italic', ['i', 'em']);
    this.map('Code', ['code']);
    this.map('Pre', ['pre']);
    this.map('TextUrl', ['a'], ({ node, output }) => {
      return {
        _: 'messageEntityTextUrl',
        offset: output.length,
        length: 0,
        url: node.attribs.href,
      };
    });
  }

  public static fromHTML(html: string) {
    let output = '';
    let entities: { _: string; offset: number; length: number }[] = [];

    const parseNodes = (doc: cheerio.Element[] | cheerio.Cheerio, parentIndex: number | null) => {
      for (const node of doc) {
        if (node.type === 'tag') {
          if (node.name === 'br') {
            output += '\n';
          } else {
            const parser = this.mappers[node.name];
            let index = null;
            if (parser) {
              index = entities.push(parser({ node, output })) - 1;
            }

            // Recurse parse other nodes
            if (node.children.length) parseNodes(node.children, index);
          }
        } else if (node.type === 'text') {
          output += node.data;
        }
      }

      // Set actual length of parent element if needed
      if (parentIndex !== null) {
        entities[parentIndex].length = output.length - entities[parentIndex].offset;
      }
    };

    parseNodes(cheerio.load('')(html), null);

    return { description: output, entities };
  }
}
