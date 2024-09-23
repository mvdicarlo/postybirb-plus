import { DefaultOptions, SubmissionType, UsernameShortcut } from 'postybirb-commons';
import { CustomShortcutService } from 'src/server/custom-shortcut/custom-shortcut.service';
import { HTMLFormatParser } from 'src/server/description-parsing/html/html.parser';
import { AdInsertParser } from 'src/server/description-parsing/miscellaneous/ad.parser';
import { UsernameParser } from 'src/server/description-parsing/miscellaneous/username.parser';
import { SettingsService } from 'src/server/settings/settings.service';
import FormContent from 'src/server/utils/form-content.util';
import { Website } from 'src/server/websites/website.base';
import { WebsitesService } from 'src/server/websites/websites.service';
import SubmissionPartEntity from '../../submission-part/models/submission-part.entity';
import { ParserService } from '../parser.service';

interface ShortcutData {
  originalText: string;
  additionalText: string;
  modifiersText: string;
  modifiers: {
    only?: string;
  };
  key: string;
}

export class DescriptionParser {
  private websiteDescriptionShortcuts: Record<string, UsernameShortcut[]>;

  constructor(
    private customShortcuts: CustomShortcutService,
    private websitesService: WebsitesService,
    private settings: SettingsService,
    private readonly parserService: ParserService,
  ) {
    this.websiteDescriptionShortcuts = websitesService.getUsernameShortcuts();
    this.websiteDescriptionShortcuts = {
      ...this.websiteDescriptionShortcuts,
      twitter: [ // injects legacy twitter shortcut back in
        {
          key: 'tw',
          url: 'https://twitter.com/$1',
        },
      ],
    };
  }

  public async parse(
    website: Website,
    defaultPart: SubmissionPartEntity<DefaultOptions>,
    websitePart: SubmissionPartEntity<DefaultOptions>,
    type: SubmissionType,
  ): Promise<string> {
    let description = FormContent.getDescription(
      defaultPart.data.description,
      websitePart.data.description,
    ).trim();

    if (description.length) {
      // Insert {default}, {title}, {tags}, {cw} shortcuts
      let tags = await this.parserService.parseTags(website, defaultPart, websitePart);
      description = this.insertDefaultShortcuts(description, [
        {
          name: 'default',
          content: defaultPart.data.description.value ?? websitePart.data.description.value ?? '',
        },
        {
          name: 'title',
          content: defaultPart.data.title ?? websitePart.data.title ?? '',
        },
        {
          name: 'tags',
          content: website.generateTagsString(tags, description, websitePart),
        },
        {
          name: 'cw',
          content: FormContent.getSpoilerText(defaultPart.data, websitePart.data),
        },
      ]);

      // Parse all potential shortcut data
      const shortcutInfo: ShortcutData[] = this.parseShortcuts(description);
      description = this.replaceShortcuts(
        description,
        shortcutInfo,
        website.constructor.name.toLowerCase(),
      );

      // Replace custom shortcuts
      description = await this.parseCustomDescriptionShortcuts(description);

      // Standardize HTML
      if (!website.skipHtmlStandardization) {
        description = HTMLFormatParser.parse(description);
      }

      // Run preparser (allows formatting of shortcuts before anything else runs)
      description = website.preparseDescription(description, type);

      // Parse website shortcuts
      Object.values(this.websiteDescriptionShortcuts).forEach(websiteShortcuts =>
        websiteShortcuts.forEach(
          shortcut => (description = UsernameParser.parse(description, shortcut.key, shortcut.url)),
        ),
      );

      // Default parser (typically conversion to HTML, BBCode, Markdown, Plaintext)
      description = website.parseDescription(description, type);
    }

    // Advertisement
    if (website.enableAdvertisement && this.settings.getValue<boolean>('advertise')) {
      description = AdInsertParser.parse(description, website.defaultDescriptionParser);
    }

    description = website.postParseDescription(description, type);
    return description.trim();
  }

  private async parseCustomDescriptionShortcuts(description: string): Promise<string> {
    const customShortcuts = await this.customShortcuts.getAll();
    customShortcuts.forEach(scEntity => {
      scEntity.content = scEntity.content.replace(/(^<p.*?>|<\/p>$)/g, ''); // Remove surrounding blocks
      if (scEntity.isDynamic) {
        const dynamicMatches =
          description.match(new RegExp(`{${scEntity.shortcut}:(.+?)}`, 'gms')) || [];
        dynamicMatches.forEach(match => {
          let content = scEntity.content;
          const matchedContent =
            match
              .replace(/(\{|\})/g, '')
              .split(':')
              .pop() || '';

          content = content.replace(/\{\$\}/gm, matchedContent);
          description = description.replace(match, content);
        });
      } else {
        description = description.replace(
          new RegExp(`{${scEntity.shortcut}}`, 'gm'),
          scEntity.content,
        );
      }
    });

    return description;
  }

  private parseShortcuts(description: string): ShortcutData[] {
    const matches = description.match(/\{([^\{]*?)\}/gms) || [];
    return matches.map(m => {
      const matchInfo = m.match(/\{(\[([^\[\]]*)\])?(\w+):?(.*?)\}/s);
      if (!matchInfo) {
        throw new Error(`Invalid shortcut: ${m}`);
      }
      const [originalText, modifiersText, mods, key, additionalText] = matchInfo;
      const modifiers = {};
      if (mods) {
        mods
          .split(';')
          .map(mod => mod.split('='))
          .forEach(([key, value]) => (modifiers[key] = value));
      }

      return {
        originalText,
        modifiersText,
        modifiers,
        key,
        additionalText,
      };
    });
  }

  private escapeRegexString(str: string): string {
    return str
      .replace(/\[/g, '\\[')
      .replace(/\]/g, '\\]')
      .replace(/\{/g, '\\{')
      .replace(/\}/g, '\\}');
  }

  private replaceShortcuts(
    description: string,
    shortcuts: ShortcutData[],
    allowed: string,
  ): string {
    shortcuts
      .filter(sc => sc.modifiers.only)
      .forEach(sc => {
        if (sc.modifiers.only.toLowerCase().split(',').includes(allowed)) {
          description = description.replace(
            sc.originalText,
            `{${sc.key}${sc.additionalText ? ':' : ''}${sc.additionalText}}`,
          );
        } else {
          const regex = new RegExp(
            `(\\s){0,1}${this.escapeRegexString(sc.originalText)}(\\s){0,1}`,
          );
          const [match, beforeSpace, afterSpace] = description.match(regex);
          if (beforeSpace && afterSpace) {
            description = description.replace(regex, ' ');
          } else if (beforeSpace) {
            description = description.replace(sc.originalText, '');
          } else if (afterSpace) {
            description = description.replace(sc.originalText, '');
          } else {
            description = description.replace(sc.originalText, '');
          }
        }
      });

    return description;
  }

  private insertDefaultShortcuts(
    description: string,
    shortcuts: { name: string; content: string }[],
  ): string {
    for (const { name, content } of shortcuts) {
      description = description.replace(new RegExp(`{${name}}`, 'gm'), content);
    }

    return description;
  }
}
