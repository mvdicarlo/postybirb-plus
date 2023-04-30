import { EventEmitter } from 'events';
import * as _ from 'lodash';
import {
  DefaultFileOptions, DefaultOptions,
  PostResponse,
  PostStatus, Submission
} from 'postybirb-commons';
import { SettingsService } from 'src/server/settings/settings.service';
import { Website } from 'src/server/websites/website.base';
import { AccountService } from '../../account/account.service';
import SubmissionEntity from '../models/submission.entity';
import { ParserService } from '../parser/parser.service';
import SubmissionPartEntity from '../submission-part/models/submission-part.entity';
import { CancellationToken } from './cancellation/cancellation-token';
import { CancellationException } from './cancellation/cancellation.exception';
import { FilePostData } from './interfaces/file-post-data.interface';
import { PostData } from './interfaces/post-data.interface';

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
  isPosting: boolean = false;
  isReady: boolean = false;
  isDone: boolean = false;
  status: PostStatus = 'UNPOSTED';
  private response: PostResponse;
  postAtTimeout: NodeJS.Timeout;
  postAt: number;
  retries: number = 0;
  private cancellationToken: CancellationToken;

  constructor(
    private readonly accountService: AccountService,
    private readonly parser: ParserService,
    private readonly settingsService: SettingsService,
    private readonly website: Website,
    private readonly submission: SubmissionEntity,
    public readonly part: SubmissionPartEntity<any>,
    private readonly defaultPart: SubmissionPartEntity<DefaultOptions>,
    public waitForExternalStart: boolean,
    public sources: string[],
    timeUntilPost: number,
  ) {
    super();
    this.postAtTimeout = setTimeout(this.post.bind(this), timeUntilPost);
    this.postAt = Date.now() + timeUntilPost;
    this.retries = settingsService.getValue<number>('postRetries') || 0;
    this.cancellationToken = new CancellationToken(this.handleCancel.bind(this));
    this.response = { website: part.website };
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
    if (this.isCancelled()) {
      return;
    }

    try {
      if (this.website.refreshBeforePost) {
        const loginStatus = await this.accountService.checkLogin(this.part.accountId);
        if (!loginStatus.loggedIn) {
          throw new Error('Not logged in');
        }
      }
      
      if (this.isCancelled()) {
        return;
      }

      const data: PostData<Submission, DefaultOptions> = await this.parser.parse(
        this.website,
        this.submission,
        this.defaultPart,
        this.part,
      );

      data.sources = this.sources;

      if (this.isCancelled()) {
        return;
      }

      this.isPosting = true;
      this.emit('posting', {
        submission: this.submission,
        part: this.part,
      });

      const res = await this.attemptPost(data);
      this.status = 'SUCCESS';
      this.done(res);
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
      if (error instanceof CancellationException) {
        this.status = 'CANCELLED';
      } else {
        this.status = 'FAILED';
      }
      this.done(errorMsg);
    }
  }

  private attemptPost(data: PostData<Submission, any>): Promise<PostResponse> {
    return new Promise(async (resolve, reject) => {
      let totalTries = this.retries + 1;
      let error = null;
      // Timeout after 20 minutes
      const timeoutTimer = setTimeout(() => {
        if (!this.isDone) {
          this.cancel();
          totalTries = 0;
          reject(
            new Error(
              `PostyFox timed out when posting. Please check ${this.website.constructor.name} to see if it actually completed.`,
            ),
          );
        }
      }, 20 * 60000);
      while (totalTries > 0 && !this.isCancelled()) {
        try {
          totalTries--;
          const accountData: any = (await this.accountService.get(this.part.accountId)).data;
          // const res = await this.fakePost();
          const res = await (this.isFilePost(data)
            ? this.website.postFileSubmission(this.cancellationToken, data as any, accountData)
            : this.website.postNotificationSubmission(
                this.cancellationToken,
                data as any,
                accountData,
              ));
          clearTimeout(timeoutTimer);
          resolve(res);
          return;
        } catch (err) {
          error = err;
          if (this.isCancelled()) {
            totalTries = 0; // kill when cancelled
          }
        }
      }
      clearTimeout(timeoutTimer);
      reject(error);
    });
  }

  private fakePost(): Promise<PostResponse> {
    return new Promise(resolve => {
      const random = _.random(0, 100);
      if (random > 90) {
        setTimeout(
          function() {
            resolve({ website: this.part.website });
          }.bind(this),
          _.random(8000),
        );
      } else {
        throw new Error('Fake Failure');
      }
    });
  }

  private done(response: PostResponse) {
    if (!this.isDone) {
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
  }

  private isFilePost(
    data: PostData<Submission, DefaultOptions>,
  ): data is FilePostData<DefaultFileOptions> {
    return !!data['primary'];
  }

  private handleCancel() {
    if (this.isPosting) {
      return;
    }
    this.status = 'CANCELLED';
    this.isDone = true;
    clearTimeout(this.postAtTimeout);
    this.emit('cancelled', {
      submission: this.submission,
      part: this.part,
    });
  }

  addSource(source: string) {
    if (!this.sources.includes(source)) {
      this.sources.push(source);
    }
  }

  cancel() {
    if (!(this.cancellationToken.isCancelled() || this.isDone)) {
      this.cancellationToken.cancel();
    }
  }

  isCancelled(): boolean {
    return this.cancellationToken.isCancelled();
  }

  doPost() {
    this.waitForExternalStart = false;
    if (this.isReady) {
      this.performPost();
    }
  }

  getMessage(): string {
    let reason = '';
    if (this.status === 'CANCELLED') {
      reason = 'was cancelled.';
    } else if (this.status === 'SUCCESS') {
      reason = 'was successful.';
    } else if (this.status === 'FAILED') {
      reason = this.response.message || this.response.error || 'Unknown error occurred.';
    }
    return `${this.part.website}: ${reason}`;
  }

  getSource(): string | undefined {
    return this.response.source;
  }

  getFullResponse() {
    return this.response;
  }
}
