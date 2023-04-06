import { PlaintextParser } from '../plaintext/plaintext.parser';
import { BBCodeParser } from '../bbcode/bbcode.parser';
import { MarkdownParser } from '../markdown/markdown.parser';

export class AdInsertParser {
  public static parse(html: string, parser: (html: string) => string): string {
    const appendNewLines: boolean = html.trim().length > 0;
    if (parser === PlaintextParser.parse) {
      html += `${appendNewLines ? '\n\n' : ''}Posted using PostyFox`;
    } else if (parser === BBCodeParser.parse) {
      html += `${
        appendNewLines ? '\n\n' : ''
      }[url=http://www.postyfox.com]Posted using PostyFox[/url]`;
    } else if (parser === MarkdownParser.parse) {
      html += MarkdownParser.parse(
        `${
          appendNewLines ? '<br /><br />' : ''
        }<p><a href="http://www.postyfox.com">Posted using PostyFox</a></p>`,
      );
    } else {
      // assume html
      html += `${
        appendNewLines ? '<br /><br />' : ''
      }<p><a href="http://www.postyfox.com">Posted using PostyFox</a></p>`;
    }

    return html;
  }
}
