import * as _ from 'lodash';
import { EventEmitter } from 'events';
import { AccountService } from '../../account/account.service';
import { PostData } from './interfaces/post-data.interface';
import {
  DefaultOptions,
  DefaultFileOptions,
} from '../submission-part/interfaces/default-options.interface';
import WebsiteValidator from 'src/websites/utils/website-validator.util';
import { FileSubmission } from '../file-submission/interfaces/file-submission.interface';
import { FilePostData } from './interfaces/file-post-data.interface';
import { Website } from 'src/websites/website.base';
import { SettingsService } from 'src/settings/settings.service';
import { AdInsertParser } from 'src/description-parsing/miscellaneous/ad.parser';
import { WebsitesService } from 'src/websites/websites.service';
import { UsernameParser } from 'src/description-parsing/miscellaneous/username.parser';
import { PostResponse } from './interfaces/post-response.interface';
import SubmissionEntity from '../models/submission.entity';
import FileSubmissionEntity from '../file-submission/models/file-submission.entity';
import { Submission } from '../interfaces/submission.interface';
import SubmissionPartEntity from '../submission-part/models/submission-part.entity';
import { PostStatus } from '../submission-part/interfaces/submission-part.interface';
import { FileManipulationService } from 'src/file-manipulation/file-manipulation.service';

export interface Poster {
  on(
    event: 'cancelled',
    listener: (data: { submission: SubmissionEntity; part: SubmissionPartEntity<any> }) => void,
  ): this;

  on(
    event: 'ready',
    listener: (data: {
      submission: SubmissionEntity;
      part: SubmissionPartEntity<any>;
      at: number;
    }) => void,
  ): this;

  on(
    event: 'posting',
    listener: (data: {
      submission: SubmissionEntity;
      part: SubmissionPartEntity<any>;
      at: number;
    }) => void,
  ): this;

  on(
    event: 'done',
    listener: (
      data: {
        submission: SubmissionEntity;
        part: SubmissionPartEntity<any>;
        status: PostStatus;
        source: string;
      },
      response: PostResponse,
    ) => void,
  ): this;

  once(
    event: 'cancelled',
    listener: (data: { submission: SubmissionEntity; part: SubmissionPartEntity<any> }) => void,
  ): this;

  once(
    event: 'posting',
    listener: (data: { submission: SubmissionEntity; part: SubmissionPartEntity<any> }) => void,
  ): this;

  once(
    event: 'done',
    listener: (
      data: {
        submission: SubmissionEntity;
        part: SubmissionPartEntity<any>;
        status: PostStatus;
        source: string;
      },
      response: PostResponse,
    ) => void,
  ): this;

  once(
    event: 'ready',
    listener: (data: {
      submission: SubmissionEntity;
      part: SubmissionPartEntity<any>;
      at: number;
    }) => void,
  ): this;
}

export class Poster extends EventEmitter {
  cancelled: boolean = false;
  isPosting: boolean = false;
  isReady: boolean = false;
  isDone: boolean = false;
  status: PostStatus = 'UNPOSTED';
  response: PostResponse;
  postAtTimeout: NodeJS.Timeout;
  sources: string[] = [];
  postAt: number;
  retries: number = 0;

  constructor(
    private accountService: AccountService,
    private settingsService: SettingsService,
    private websitesService: WebsitesService,
    public fileManipulator: FileManipulationService,
    private website: Website,
    private submission: SubmissionEntity,
    public part: SubmissionPartEntity<any>,
    private defaultPart: SubmissionPartEntity<DefaultOptions>,
    public waitForExternalStart: boolean,
    timeUntilPost: number,
  ) {
    super();
    this.postAtTimeout = setTimeout(this.post.bind(this), timeUntilPost);
    this.postAt = Date.now() + timeUntilPost;
    this.retries = settingsService.getValue<number>('postRetries') || 0;
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
        const options: DefaultFileOptions = data.options as DefaultFileOptions;
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

        if (options.autoScale && this.fileManipulator.canScale(this.submission.primary.mimetype)) {
          const scaleOptions = this.website.getScalingOptions(this.submission.primary);
          const scaled = await this.fileManipulator.scale(
            this.submission.primary.buffer,
            this.submission.primary.mimetype,
            scaleOptions.maxSize,
            { convertToJPEG: scaleOptions.converToJPEG },
          );
          fileData.primary.file.buffer = scaled.buffer;
          fileData.primary.file.options.contentType = scaled.mimetype;
        }

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
          ? await Promise.all(
              additional.map(async record => {
                const rec = {
                  type: record.type,
                  file: {
                    buffer: record.buffer,
                    options: {
                      contentType: record.mimetype,
                      filename: record.name,
                    },
                  },
                };

                if (options.autoScale && this.fileManipulator.canScale(record.mimetype)) {
                  const scaleOptions = this.website.getScalingOptions(record);
                  const scaled = await this.fileManipulator.scale(
                    record.buffer,
                    record.mimetype,
                    scaleOptions.maxSize,
                    { convertToJPEG: scaleOptions.converToJPEG },
                  );
                  rec.file.buffer = scaled.buffer;
                  rec.file.options.contentType = scaled.mimetype;
                }

                return rec;
              }),
            )
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

      await this.attemptPost(data);
    } catch (err) {
      const error: Error | PostResponse = err;
      const errorMsg: PostResponse = {
        website: this.part.website,
        time: new Date().toLocaleString(),
      };
      if (error instanceof Error) {
        errorMsg.stack = error.stack;
        errorMsg.error = error.toString();
      } else {
        Object.assign(errorMsg, error);
      }
      this.status = 'FAILED';
      this.done(errorMsg);
    }
  }

  private async attemptPost(data: PostData<Submission>): Promise<PostResponse> {
    // TODO post
    let totalTries = this.retries + 1;
    let error = null;
    while (totalTries) {
      try {
        totalTries--;
        await this.fakePost();
        this.done({ website: this.part.website });
        return;
      } catch (err) {
        error = err;
      }
    }
    throw error;
  }

  private fakePost(): Promise<PostResponse> {
    return new Promise(resolve => {
      const random = _.random(0, 100);
      if (random > 15) {
        setTimeout(
          function() {
            this.status = 'SUCCESS';
            resolve();
          }.bind(this),
          _.random(8000),
        );
      } else {
        throw new Error('Fake Failure');
      }
    });
  }

  private done(response: PostResponse) {
    this.isDone = true;
    this.isPosting = false;
    this.response = response;
    this.emit('done', {
      submission: this.submission,
      part: this.part,
      source: response.source,
      status: this.status,
    });
  }

  private isFileSubmission(submission: Submission): submission is FileSubmission {
    return submission instanceof FileSubmissionEntity;
  }

  addSource(source: string) {
    if (!this.sources.includes(source)) {
      this.sources.push(source);
    }
  }

  cancel() {
    if (this.isPosting || this.isDone) {
      return;
    }
    this.status = 'CANCELLED';
    this.cancelled = true;
    this.isDone = true;
    if (!this.isReady) {
      clearTimeout(this.postAtTimeout);
      this.emit('cancelled', {
        submission: this.submission,
        part: this.part,
      });
    }
  }

  doPost() {
    this.waitForExternalStart = false;
    if (this.isReady) {
      this.performPost();
    }
  }
}
