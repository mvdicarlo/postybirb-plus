export class CustomHTMLParser {
  public static parse(html: string): string {
    if (!html) {
      return '';
    }
    const blocks = ['p', 'div', 'pre'];
    blocks.forEach(block => {
      const regex = new RegExp(`<${block}(.*?)>((.|\n)*?)<\/${block}>`, 'gmi');
      html = html.replace(regex, '$2<br>');
    });

    return html;
  }
}
