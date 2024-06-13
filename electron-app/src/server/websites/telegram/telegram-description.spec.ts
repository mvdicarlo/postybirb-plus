import { TelegramDescription } from './telegram-description.parser';

describe('Telegram Description Parser', () => {
  it('should not have double newlines', () => {
    const html = `<p>Test description</p>
<p>Second line</p>
<p> </p>
<p>Text</p>`;

    const parsed = TelegramDescription.fromHTML(html);
    expect(parsed).toStrictEqual({
      description: 'Test description\nSecond line\n \nText',
      entities: [],
    });
  });
  it('should parse html right', () => {
    const html = `<p>Test description</p>
<p> </p>
<p>Link test: <a href="https://deviantart.com/">hidden text</a></p>
<p> </p>
<p>Link test plain: https://deviantart.com/</p>
<p>Without https: deviantart.com</p>`;

    const parsed = TelegramDescription.fromHTML(html);
    expect(parsed).toStrictEqual({
      description:
        'Test description\n \nLink test: hidden text\n \nLink test plain: https://deviantart.com/\nWithout https: deviantart.com',
      entities: [
        {
          _: 'messageEntityTextUrl',
          length: 11,
          offset: 30,
          url: 'https://deviantart.com/',
        },
      ],
    });
  });
});
