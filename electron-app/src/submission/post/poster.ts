import * as fs from 'fs-extra';
import { EventEmitter } from 'events';
import { Submission } from '../interfaces/submission.interface';
import { SubmissionPart } from '../interfaces/submission-part.interface';
import { Website } from '../../websites/interfaces/website.interface';
import { AccountService } from '../../account/account.service';

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
    private waitForExternalStart: boolean,
    private timeToPost: number,
  ) {
    super();
    this.postAtTimeout = setTimeout(this.post, timeToPost);
    // TODO sources from submission
  }

  private post() {
    this.isReady = true;
    this.emit('ready', { id: this.submission.id, accountId: this.part.accountId });
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

      if (this.cancelled) {
        this.emit('cancelled', {
          id: this.submission.id,
          accountId: this.part.accountId,
          cancelled: this.cancelled,
        });
        return;
      }

      this.isPosting = true;
      this.emit('posting', {
        id: this.submission.id,
        accountId: this.part.accountId,
      });
      // TODO do post
    } catch (err) {
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
