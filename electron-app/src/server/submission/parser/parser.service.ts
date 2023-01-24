import * as _ from 'lodash';
import { Injectable } from '@nestjs/common';
import { SettingsService } from 'src/server/settings/settings.service';
import { TagConverterService } from 'src/server/tag-converter/tag-converter.service';
import { CustomShortcutService } from 'src/server/custom-shortcut/custom-shortcut.service';
import { FileManipulationService } from 'src/server/file-manipulation/file-manipulation.service';
import { Website } from 'src/server/websites/website.base';
import SubmissionEntity from '../models/submission.entity';
import SubmissionPartEntity from '../submission-part/models/submission-part.entity';
import {
  DefaultOptions,
  DefaultFileOptions,
  UsernameShortcut,
  Submission,
  FileSubmission,
  FileRecord,
} from 'postybirb-commons';
import { PostData } from '../post/interfaces/post-data.interface';
import FormContent from 'src/server/utils/form-content.util';
import { AdInsertParser } from 'src/server/description-parsing/miscellaneous/ad.parser';
import { WebsitesService } from 'src/server/websites/websites.service';

import { UsernameParser } from 'src/server/description-parsing/miscellaneous/username.parser';
import { SubmissionRating } from 'postybirb-commons';

import FileSubmissionEntity from '../file-submission/models/file-submission.entity';
import { FilePostData, PostFileRecord } from '../post/interfaces/file-post-data.interface';

import { HTMLFormatParser } from 'src/server/description-parsing/html/html.parser';
import { SubmissionType } from 'postybirb-commons';
import { DescriptionParser } from './section-parsers/description.parser';

@Injectable()
export class ParserService {
  private descriptionParser: DescriptionParser;

  constructor(
    private readonly settings: SettingsService,
    private readonly tagConverter: TagConverterService,
    private readonly customShortcuts: CustomShortcutService,
    private readonly fileManipulator: FileManipulationService,
    websitesService: WebsitesService,
  ) {
    this.descriptionParser = new DescriptionParser(customShortcuts, websitesService, settings);
  }

  public async parse(
    website: Website,
    submission: SubmissionEntity,
    defaultPart: SubmissionPartEntity<DefaultOptions>,
    websitePart: SubmissionPartEntity<any>,
  ): Promise<PostData<Submission, DefaultOptions>> {
    const description = await this.parseDescription(
      website,
      defaultPart,
      websitePart,
      submission.type,
    );
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
    websitePart: SubmissionPartEntity<DefaultOptions>,
    type: SubmissionType,
  ): Promise<string> {
    return this.descriptionParser.parse(website, defaultPart, websitePart, type);
  }

  public async parseTags(
    website: Website,
    defaultPart: SubmissionPartEntity<DefaultOptions>,
    websitePart: SubmissionPartEntity<DefaultOptions>,
  ): Promise<string[]> {
    let tags = _.uniq<string>(FormContent.getTags(defaultPart.data.tags, websitePart.data.tags));
    if (tags.length) {
      const conversionMap = {};
      (await this.tagConverter.getTagConvertersForWebsite(website.constructor.name)).forEach(
        (converter) => {
          conversionMap[converter.tag] = converter.getTagForWebsite(website.constructor.name);
        },
      );

      tags = tags.map((tag) => conversionMap[tag] || tag).filter((tag) => !!tag.trim().length);
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
    return (websitePart.data.title || defaultPart.data.title || submission.title).substring(0, 160);
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
    data.primary = await this.attemptFileScale(websitePart.accountId, website, submission.primary, canScale);

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
        (record) => !record.ignoredAccounts!.includes(websitePart.accountId),
      );

      data.additional = await Promise.all(
        additionalFiles.map((file) => this.attemptFileScale(websitePart.accountId, website, file, canScale)),
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
    accountId: string,
    website: Website,
    file: FileRecord,
    canScale: boolean,
  ): Promise<PostFileRecord> {
    const record = this.fileRecordAsPostFileRecord(file);
    if (canScale && this.fileManipulator.canScale(file.mimetype)) {
      const scaleOptions = website.getScalingOptions(file, accountId);
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
