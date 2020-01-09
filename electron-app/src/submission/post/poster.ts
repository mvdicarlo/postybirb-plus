import * as _ from 'lodash';
import { EventEmitter } from 'events';
import { Submission } from '../interfaces/submission.interface';
import { SubmissionPart } from '../interfaces/submission-part.interface';
import { AccountService } from '../../account/account.service';
import { PostData } from './interfaces/post-data.interface';
import { DefaultOptions, DefaultFileOptions } from '../interfaces/default-options.interface';
import WebsiteValidator from 'src/websites/utils/website-validator.util';
import { FileSubmission } from '../file-submission/interfaces/file-submission.interface';
import { FilePostData } from './interfaces/file-post-data.interface';
import { Website } from 'src/websites/website.base';
import { SettingsService } from 'src/settings/settings.service';
import { AdInsertParser } from 'src/description-parsing/miscellaneous/ad.parser';
import { WebsitesService } from 'src/websites/websites.service';
import { UsernameParser } from 'src/description-parsing/miscellaneous/username.parser';
import { PostResponse } from './interfaces/post-response.interface';

export interface Poster {
  on(
    event: 'cancelled',
    listener: (data: { submission: Submission; part: SubmissionPart<any> }) => void,
  ): this;

  on(
    event: 'ready',
    listener: (data: { submission: Submission; part: SubmissionPart<any>; at: number }) => void,
  ): this;

  on(
    event: 'posting',
    listener: (data: { submission: Submission; part: SubmissionPart<any>; at: number }) => void,
  ): this;

  on(
    event: 'done',
    listener: (
      data: {
        submission: Submission;
        part: SubmissionPart<any>;
        success: boolean;
        source: string;
      },
      response: PostResponse,
    ) => void,
  ): this;

  once(
    event: 'cancelled',
    listener: (data: { submission: Submission; part: SubmissionPart<any> }) => void,
  ): this;

  once(
    event: 'posting',
    listener: (data: { submission: Submission; part: SubmissionPart<any> }) => void,
  ): this;

  once(
    event: 'done',
    listener: (
      data: {
        submission: Submission;
        part: SubmissionPart<any>;
        success: boolean;
        source: string;
      },
      response: PostResponse,
    ) => void,
  ): this;

  once(
    event: 'ready',
    listener: (data: { submission: Submission; part: SubmissionPart<any>; at: number }) => void,
  ): this;
}

export class Poster extends EventEmitter {
  cancelled: boolean = false;
  success: boolean = false;
  isPosting: boolean = false;
  isReady: boolean = false;
  isDone: boolean = false;
  response: PostResponse;
  postAtTimeout: NodeJS.Timeout;
  sources: string[] = [];
  postAt: number;

  constructor(
    private accountService: AccountService,
    private settingsService: SettingsService,
    private websitesService: WebsitesService,
    private website: Website,
    private submission: Submission,
    public part: SubmissionPart<any>,
    private defaultPart: SubmissionPart<DefaultOptions>,
    public waitForExternalStart: boolean,
    timeUntilPost: number,
  ) {
    super();
    this.postAtTimeout = setTimeout(this.post, timeUntilPost);
    this.postAt = Date.now() + timeUntilPost;
  }

  private post() {
    this.isReady = true;
    this.emit('ready', {
      submission: this.submission,
      part: this.part,
    });
    if (!this.waitForExternalStart) {
      this.performPost();
    }
  }

  private async performPost() {
    if (this.cancelled) {
      this.isDone = true;
      this.emit('cancelled', {
        submission: this.submission,
        part: this.part,
      });
      return;
    }

    try {
      const loginStatus = await this.accountService.checkLogin(this.part.accountId);
      if (this.cancelled) {
        this.isDone = true;
        this.emit('cancelled', {
          submission: this.submission,
          part: this.part,
        });
        return;
      }
      if (!loginStatus.loggedIn) {
        throw new Error('Not logged in');
      }

      let description = this.website.preparseDescription(
        WebsiteValidator.getDescription(
          this.defaultPart.data.description,
          this.part.data.description,
        ),
      );

      Object.values(this.websitesService.getUsernameShortcuts()).forEach(shortcuts => {
        shortcuts.forEach(sc => (description = UsernameParser.parse(description, sc.key, sc.url)));
      });

      description = this.website.parseDescription(description);
      if (this.website.enableAdvertisement) {
        if (this.settingsService.getValue<boolean>('advertise')) {
          description = AdInsertParser.parse(description, this.website.defaultDescriptionParser);
        }
      }

      // TODO figure out how to do multi post to websites that don't support it
      const data: PostData<Submission> = {
        description,
        options: this.part.data,
        part: this.part,
        rating: this.part.data.rating || this.defaultPart.data.rating,
        sources: this.sources,
        submission: this.submission,
        tags: WebsiteValidator.getTags(this.defaultPart.data.tags, this.part.data.tags),
        title: this.part.data.title || this.defaultPart.data.title || this.submission.title,
      };

      if (this.isFileSubmission(this.submission)) {
        const fileData: FilePostData = data as FilePostData;
        fileData.primary = {
          type: this.submission.primary.type,
          file: {
            buffer: this.submission.primary.buffer,
            options: {
              contentType: this.submission.primary.mimetype,
              filename: this.submission.primary.name,
            },
          },
        };

        if (this.submission.thumbnail && (this.part.data as DefaultFileOptions).useThumbnail) {
          fileData.thumbnail = {
            buffer: this.submission.thumbnail.buffer,
            options: {
              contentType: this.submission.thumbnail.mimetype,
              filename: this.submission.thumbnail.name,
            },
          };
        }

        const additional = (this.submission.additional || []).filter(
          record => !record.ignoredAccounts!.includes(this.part.accountId),
        );

        fileData.additional = this.website.acceptsAdditionalFiles
          ? additional.map(record => {
              return {
                type: record.type,
                file: {
                  buffer: record.buffer,
                  options: {
                    contentType: record.mimetype,
                    filename: record.name,
                  },
                },
              };
            })
          : [];

        if (this.cancelled) {
          this.isDone = true;
          this.emit('cancelled', {
            submission: this.submission,
            part: this.part,
          });
          return;
        }
      }

      this.isPosting = true;
      this.emit('posting', {
        submission: this.submission,
        part: this.part,
      });

      // TODO post
      const random = _.random(0, 100);
      if (random > 50) {
        this.done(true, { website: this.part.website });
      } else {
        throw new Error('Fake Failure');
      }
    } catch (err) {
      const error: Error | PostResponse = err;
      const errorMsg: PostResponse = {
        website: this.part.website,
        time: new Date().toLocaleString(),
      };
      if (error instanceof Error) {
        errorMsg.stack = error.stack;
        errorMsg.error = error.message;
      } else {
        Object.assign(errorMsg, error);
      }
      this.done(false, errorMsg);
    }
  }

  private done(success: boolean, response: PostResponse) {
    this.isDone = true;
    this.success = success;
    this.response = response;
    this.emit('done', {
      submission: this.submission,
      part: this.part,
      success,
      source: response.source,
    });
  }

  private isFileSubmission(submission: Submission): submission is FileSubmission {
    return !!(submission as FileSubmission).primary;
  }

  addSource(source: string) {
    if (!this.sources.includes(source)) {
      this.sources.push(source);
    }
  }

  cancel() {
    if (this.isPosting) {
      return;
    }
    this.cancelled = true;
  }

  doPost() {
    this.waitForExternalStart = false;
    if (this.isReady) {
      this.performPost();
    }
  }
}
