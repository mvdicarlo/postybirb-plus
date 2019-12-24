import * as fs from 'fs-extra';
import { EventEmitter } from 'events';
import { Submission } from '../interfaces/submission.interface';
import { SubmissionPart } from '../interfaces/submission-part.interface';
import { Website } from '../../websites/interfaces/website.interface';
import { AccountService } from '../../account/account.service';
import { PostData } from './interfaces/post-data.interface';
import { DefaultOptions, DefaultFileOptions } from '../interfaces/default-options.interface';
import WebsiteValidator from 'src/websites/utils/website-validator.util';
import { FileSubmission } from '../file-submission/interfaces/file-submission.interface';
import { FilePostData } from './interfaces/file-post-data.interface';

export default class Poster extends EventEmitter {
  cancelled: boolean = false;
  isPosting: boolean = false;
  isReady: boolean = false;
  postAtTimeout: NodeJS.Timeout;
  sources: string[] = [];

  constructor(
    private accountService: AccountService,
    private website: Website,
    private submission: Submission,
    private part: SubmissionPart<any>,
    private defaultPart: SubmissionPart<DefaultOptions>,
    private waitForExternalStart: boolean,
    private timeToPost: number,
  ) {
    super();
    this.postAtTimeout = setTimeout(this.post, timeToPost);
    this.sources = [...submission.sources];
  }

  private post() {
    this.isReady = true;
    this.emit('ready', {
      id: this.submission.id,
      accountId: this.part.accountId,
      at: this.waitForExternalStart,
    });
    if (!this.waitForExternalStart) {
      this.performPost();
    }
  }

  private async performPost() {
    if (this.cancelled) {
      this.emit('cancelled', {
        id: this.submission.id,
        accountId: this.part.accountId,
        cancelled: this.cancelled,
      });
      return;
    }

    try {
      const loginStatus = await this.accountService.checkLogin(this.part.accountId);
      if (this.cancelled) {
        this.emit('cancelled', {
          id: this.submission.id,
          accountId: this.part.accountId,
          cancelled: this.cancelled,
        });
        return;
      }
      if (!loginStatus.loggedIn) {
        throw new Error('Not logged in');
      }

      // TODO create post object
      const data: PostData<Submission> = {
        description: WebsiteValidator.getDescription(
          this.defaultPart.data.description,
          this.part.data.description,
        ),
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
          buffer: await fs.readFile(this.submission.primary.location),
          options: {
            contentType: this.submission.primary.mimetype,
            filename: this.submission.primary.name,
          },
        };

        if (this.submission.thumbnail && (this.part.data as DefaultFileOptions).useThumbnail) {
          fileData.thumbnail = {
            buffer: await fs.readFile(this.submission.thumbnail.location),
            options: {
              contentType: this.submission.thumbnail.mimetype,
              filename: this.submission.thumbnail.name,
            },
          };
        }

        const additional = (this.submission.additional || []).filter(
          record => !record.ignoredAccounts!.includes(this.part.accountId),
        );

        fileData.additional = await Promise.all(
          additional.map(async record => {
            return {
              buffer: await fs.readFile(record.location),
              options: {
                contentType: record.mimetype,
                filename: record.name,
              },
            };
          }),
        );

        if (this.cancelled) {
          this.emit('cancelled', {
            id: this.submission.id,
            accountId: this.part.accountId,
            cancelled: this.cancelled,
          });
          return;
        }
      }

      this.isPosting = true;
      this.emit('posting', {
        id: this.submission.id,
        accountId: this.part.accountId,
      });

      // TODO post
    } catch (err) {
      // TODO better error emit for better message
      this.emit('error', err);
      this.emit('done', {
        id: this.submission.id,
        accountId: this.part.accountId,
        success: false,
        sources: this.sources,
        cancelled: this.cancelled,
      });
    }
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
