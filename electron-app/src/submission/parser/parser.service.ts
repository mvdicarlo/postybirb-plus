import * as _ from 'lodash';
import { Injectable } from '@nestjs/common';
import { SettingsService } from 'src/settings/settings.service';
import { TagConverterService } from 'src/tag-converter/tag-converter.service';
import { CustomShortcutService } from 'src/custom-shortcut/custom-shortcut.service';
import { FileManipulationService } from 'src/file-manipulation/file-manipulation.service';
import { Website } from 'src/websites/website.base';
import SubmissionEntity from '../models/submission.entity';
import SubmissionPartEntity from '../submission-part/models/submission-part.entity';
import {
  DefaultOptions,
  DefaultFileOptions,
} from '../submission-part/interfaces/default-options.interface';
import { PostData } from '../post/interfaces/post-data.interface';
import FormContent from 'src/utils/form-content.util';
import { AdInsertParser } from 'src/description-parsing/miscellaneous/ad.parser';
import { WebsitesService } from 'src/websites/websites.service';
import { UsernameShortcut } from 'src/websites/interfaces/username-shortcut.interface';
import { UsernameParser } from 'src/description-parsing/miscellaneous/username.parser';
import { SubmissionRating } from '../enums/submission-rating.enum';
import { Submission } from '../interfaces/submission.interface';
import { FileSubmission } from '../file-submission/interfaces/file-submission.interface';
import FileSubmissionEntity from '../file-submission/models/file-submission.entity';
import { FilePostData, PostFileRecord } from '../post/interfaces/file-post-data.interface';
import { FileRecord } from '../file-submission/interfaces/file-record.interface';

@Injectable()
export class ParserService {
  private websiteDescriptionShortcuts: Record<string, UsernameShortcut[]>;

  constructor(
    private readonly settings: SettingsService,
    private readonly tagConverter: TagConverterService,
    private readonly customShortcuts: CustomShortcutService,
    private readonly fileManipulator: FileManipulationService,
    websitesService: WebsitesService,
  ) {
    this.websiteDescriptionShortcuts = websitesService.getUsernameShortcuts();
  }

  public async parse(
    website: Website,
    submission: SubmissionEntity,
    defaultPart: SubmissionPartEntity<DefaultOptions>,
    websitePart: SubmissionPartEntity<any>,
  ): Promise<PostData<Submission, DefaultOptions>> {
    const description = await this.parseDescription(website, defaultPart, websitePart);
    const tags = await this.parseTags(website, defaultPart, websitePart);

    const data: PostData<Submission, any> = {
      description,
      options: websitePart.data || {},
      part: websitePart,
      rating: this.getRating(defaultPart, websitePart),
      sources: [],
      submission,
      tags,
      title: this.getTitle(submission, defaultPart, websitePart),
    };

    if (this.isFileSubmission(submission)) {
      await this.parseFileSubmission(
        data as FilePostData<DefaultFileOptions>,
        website,
        submission,
        defaultPart,
        websitePart,
      );
    }

    return data;
  }

  public async parseDescription(
    website: Website,
    defaultPart: SubmissionPartEntity<DefaultOptions>,
    websitePart: SubmissionPartEntity<any>,
  ): Promise<string> {
    let description = FormContent.getDescription(
      defaultPart.data.description,
      websitePart.data.decription,
    ).trim();

    if (description.length) {
      // Replace custom shortcuts
      description = await this.parseCustomDescriptionShortcuts(description);

      // Run preparser (allows formatting of shortcuts before anything else runs)
      description = website.preparseDescription(description);

      // Parse website shortcuts
      Object.values(this.websiteDescriptionShortcuts).forEach(websiteShortcuts =>
        websiteShortcuts.forEach(
          shortcut => (description = UsernameParser.parse(description, shortcut.key, shortcut.url)),
        ),
      );

      // Default parser (typically conversion to HTML, BBCode, Markdown, Plaintext)
      description = website.parseDescription(description);
    }

    // Advertisement
    if (website.enableAdvertisement && this.settings.getValue<boolean>('advertise')) {
      description = AdInsertParser.parse(description, website.defaultDescriptionParser);
    }

    description = website.postParseDescription(description);

    return description.trim();
  }

  private async parseCustomDescriptionShortcuts(description: string): Promise<string> {
    const customShortcuts = await this.customShortcuts.getAll();
    customShortcuts.forEach(scEntity => {
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

  public async parseTags(
    website: Website,
    defaultPart: SubmissionPartEntity<DefaultOptions>,
    websitePart: SubmissionPartEntity<any>,
  ): Promise<string[]> {
    let tags = _.uniq<string>(FormContent.getTags(defaultPart.data.tags, websitePart.data.tags));
    if (tags.length) {
      const conversionMap = {};
      (await this.tagConverter.getTagConvertersForWebsite(website.constructor.name)).forEach(
        converter => {
          conversionMap[converter.tag] = converter.getTagForWebsite(website.constructor.name);
        },
      );

      tags = tags.map(tag => conversionMap[tag] || tag);
    }

    return tags;
  }

  public getRating(
    defaultPart: SubmissionPartEntity<DefaultOptions>,
    websitePart: SubmissionPartEntity<any>,
  ): SubmissionRating {
    return (websitePart.data.rating || defaultPart.data.rating).toLowerCase();
  }

  public getTitle(
    submission: SubmissionEntity,
    defaultPart: SubmissionPartEntity<DefaultOptions>,
    websitePart: SubmissionPartEntity<any>,
  ): string {
    return websitePart.data.title || defaultPart.data.title || submission.title;
  }

  private isFileSubmission(submission: Submission): submission is FileSubmission {
    return submission instanceof FileSubmissionEntity;
  }

  private async parseFileSubmission(
    data: FilePostData<DefaultFileOptions>,
    website: Website,
    submission: FileSubmission,
    defaultPart: SubmissionPartEntity<DefaultOptions>,
    websitePart: SubmissionPartEntity<any>,
  ): Promise<void> {
    const options: DefaultFileOptions = data.options as DefaultFileOptions;
    const canScale = options.autoScale;
    data.primary = await this.attemptFileScale(website, submission.primary, canScale);

    if (submission.thumbnail && options.useThumbnail) {
      data.thumbnail = this.fileRecordAsPostFileRecord(submission.thumbnail).file;
    }

    if (submission.fallback) {
      data.fallback = this.fileRecordAsPostFileRecord(submission.fallback).file;
      const { text, type, extension } = website.fallbackFileParser(
        data.fallback.value.toString('utf8'),
      );
      data.fallback.options.contentType = type;
      data.fallback.options.filename = data.fallback.options.filename.replace('html', extension);
      data.fallback.value = Buffer.from(text, 'utf8');
    }

    if (website.acceptsAdditionalFiles) {
      const additionalFiles = (submission.additional || []).filter(
        record => !record.ignoredAccounts!.includes(websitePart.accountId),
      );

      data.additional = await Promise.all(
        additionalFiles.map(file => this.attemptFileScale(website, file, canScale)),
      );
    } else {
      data.additional = [];
    }
  }

  private fileRecordAsPostFileRecord(file: FileRecord): PostFileRecord {
    return {
      type: file.type,
      file: {
        value: file.buffer,
        options: {
          contentType: file.mimetype,
          filename: this.parseFileName(file.name),
        },
      },
    };
  }

  private async attemptFileScale(
    website: Website,
    file: FileRecord,
    canScale: boolean,
  ): Promise<PostFileRecord> {
    const record = this.fileRecordAsPostFileRecord(file);
    if (canScale && this.fileManipulator.canScale(file.mimetype)) {
      const scaleOptions = website.getScalingOptions(file);
      if (scaleOptions) {
        const { buffer, mimetype } = await this.fileManipulator.scale(
          file.buffer,
          file.mimetype,
          scaleOptions.maxSize,
          { convertToJPEG: scaleOptions.converToJPEG },
        );
        if (mimetype !== file.mimetype) {
          record.file.options.filename = this.fixFileExtension(mimetype, file.name);
        }
        record.file.options.contentType = mimetype;
        record.file.value = buffer;
      }
    }

    return record;
  }

  private parseFileName(filename: string): string {
    return filename.replace(/#/g, '_');
  }

  private fixFileExtension(mimetype: string, filename: string): string {
    const parts = filename.split('.');
    parts.pop(); // remove extension
    if (mimetype === 'image/jpeg') {
      parts.push('jpg');
    } else if (mimetype === 'image/png') {
      parts.push('png');
    }

    return parts.join('.');
  }
}
