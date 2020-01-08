import { Injectable, Logger, Inject, forwardRef, BadRequestException } from '@nestjs/common';
import * as fs from 'fs-extra';
import * as _ from 'lodash';
import { SubmissionService } from '../submission.service';
import { Submission } from '../interfaces/submission.interface';
import { SubmissionType } from '../enums/submission-type.enum';
import { WebsiteProvider } from 'src/websites/website-provider.service';
import { SettingsService } from 'src/settings/settings.service';
import { SubmissionPartService } from '../submission-part/submission-part.service';
import { AccountService } from 'src/account/account.service';
import { DefaultOptions } from '../interfaces/default-options.interface';
import { SubmissionPart } from '../interfaces/submission-part.interface';
import { WebsitesService } from 'src/websites/websites.service';
import { Website } from 'src/websites/website.base';
import { FileSubmission } from '../file-submission/interfaces/file-submission.interface';
import { FileRecord } from '../file-submission/interfaces/file-record.interface';
import { Poster } from './poster';
import { LogService } from '../log/log.service';

@Injectable()
export class PostService {
  private readonly logger = new Logger(PostService.name);

  private posting: { [key: string]: Submission } = {
    [SubmissionType.FILE]: null,
    [SubmissionType.NOTIFICATION]: null,
  };

  private postingParts: { [key: string]: Poster[] } = {
    [SubmissionType.FILE]: [],
    [SubmissionType.NOTIFICATION]: [],
  };

  private submissionQueue: { [key: string]: Submission[] } = {
    [SubmissionType.FILE]: [],
    [SubmissionType.NOTIFICATION]: [],
  };

  // TODO save this somewhere
  private accountPostTimeMap: { [key: string]: number } = {};

  constructor(
    @Inject(forwardRef(() => SubmissionService))
    private readonly submissionService: SubmissionService,
    private readonly accountService: AccountService,
    private readonly websites: WebsiteProvider,
    private readonly websitesService: WebsitesService,
    private readonly settings: SettingsService,
    private readonly partService: SubmissionPartService,
    private readonly logService: LogService,
  ) {}

  queue(submission: Submission) {
    this.logger.log(submission, 'Queueing');
    if (!this.isPosting(submission.type)) {
      this.post(submission);
    } else {
      this.insert(submission);
    }
  }

  cancel(submission: Submission) {
    if (this.isCurrentlyPosting(submission)) {
      // Need to handle cancel event
      this.postingParts[submission.type].forEach(poster => poster.cancel());
    } else if (this.isCurrentlyQueued(submission)) {
      this.submissionQueue[submission.type].splice(
        this.submissionQueue[submission.type].findIndex(s => s.id === submission.id),
        1,
      );
    } else {
      return;
    }

    this.notifyPostingStateChanged();
  }

  isCurrentlyPosting(submission: Submission): boolean {
    return this.posting[submission.type] && this.posting[submission.type].id === submission.id;
  }

  isCurrentlyPostingToAny(): boolean {
    return !!Object.values(this.posting).filter(post => !!post).length;
  }

  isCurrentlyQueued(submission: Submission): boolean {
    return !!this.submissionQueue[submission.type].find(s => s.id === submission.id);
  }

  private insert(submission: Submission) {
    if (!this.submissionQueue[submission.type].find(s => s.id === submission.id)) {
      this.logger.log(submission.id, `Inserting Into Queue ${submission.type}`);
      this.submissionQueue[submission.type].push(submission);
      this.notifyPostingStateChanged();
    }
  }

  private isPosting(type: SubmissionType): boolean {
    return !!this.posting[type];
  }

  private async post(submission: Submission) {
    this.logger.log(submission.id, 'Posting');

    const validationPackage = await this.submissionService.validate(submission);
    const isValid: boolean = !!_.flatMap(validationPackage.problems, p => p.problems).length;

    if (isValid) {
      this.posting[submission.type] = submission;
      this.notifyPostingStateChanged();
      const parts = await this.partService.getPartsForSubmission(submission.id);
      const [defaultPart] = parts.filter(p => p.isDefault);
      if (this.isFileSubmission(submission)) {
        await this.preloadFiles(submission);
      }
      this.postingParts[submission.type] = parts
        .filter(p => !p.isDefault)
        .map(p => this.createPoster(submission, p, defaultPart));

      this.postingParts[submission.type].forEach(poster => {
        poster.once('cancelled', data => this.checkForCompletion(data.submission));
        // TODO handle done behavior for logging and saving
        poster.once('done', data => {
          this.checkForCompletion(data.submission);
        });
        // TODO handle 'error' 'posting'
      });
    } else {
      this.posting[submission.type] = null;
      throw new BadRequestException('Submission has problems');
    }
  }

  private checkForCompletion(submission: Submission) {
    if (this.postingParts[submission.type].filter(poster => !poster.isDone).length) {
      // TODO not done (send socket change event)
    } else {
      this.logService
        .addLog(
          submission,
          this.postingParts[submission.type].map(poster => ({
            part: poster.part,
            response: poster.response,
          })),
        )
        .finally(() => {
          // TODO emit notification to UI and OS
          this.submissionService.deleteSubmission(submission.id);
        });

      this.clearAndPostNext(submission.type);
    }
  }

  private clearAndPostNext(type: SubmissionType) {
    const [next] = this.submissionQueue[type].splice(0, 1);
    this.postingParts[type] = [];
    this.posting[type] = null;
    if (next) {
      try {
        this.post(next);
      } catch (err) {
        this.clearAndPostNext(type); // keep searching until there is a valid submission to post
      }
    } else {
      this.notifyPostingStateChanged();
    }
  }

  private createPoster(
    submission: Submission,
    part: SubmissionPart<any>,
    defaultPart: SubmissionPart<DefaultOptions>,
  ): Poster {
    return new Poster(
      this.accountService,
      this.settings,
      this.websitesService,
      this.websites.getWebsiteModule(part.website),
      submission,
      part,
      defaultPart,
      this.websites.getWebsiteModule(part.website).acceptsSourceUrls,
      this.getWaitTime(part.accountId, this.websites.getWebsiteModule(part.website)),
    );
  }

  private getWaitTime(accountId: string, website: Website): number {
    const lastPosted = _.get(
      this.accountPostTimeMap,
      `${accountId}-${website.constructor.name}`,
      0,
    );
    const timeToWait = website.waitBetweenPostsInterval || 0;
    const timeDifference = Date.now() - lastPosted;
    if (timeDifference >= timeToWait) {
      // when the time since the last post is already greater than the specified wait time
      return 4000;
    } else {
      return Math.max(Math.abs(timeDifference - timeToWait), 4000);
    }
  }

  private isFileSubmission(submission: Submission): submission is FileSubmission {
    return !!(submission as FileSubmission).primary;
  }

  private async preloadFiles(submission: FileSubmission): Promise<void> {
    const files: FileRecord[] = _.compact([
      submission.primary,
      submission.thumbnail,
      ...submission.additional,
    ]);
    await Promise.all(
      files.map(record => {
        return fs
          .readFile(record.location)
          .then(buffer => (record.buffer = buffer))
          .catch(err => {
            this.logger.error(err, 'Preload File Failure');
          });
      }),
    );
  }

  private notifyPostingStateChanged = _.debounce(
    () => this.submissionService.postingStateChanged(),
    1000,
  );
}
