import Turndown from 'turndown';

export class MarkdownConverter {
  static convert(html: string): string {
    const td = new Turndown();
    return td.turndown(html).trim();
  }
}
