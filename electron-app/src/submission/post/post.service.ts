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
import { DefaultOptions } from '../submission-part/interfaces/default-options.interface';
import { SubmissionPart } from '../submission-part/interfaces/submission-part.interface';
import { WebsitesService } from 'src/websites/websites.service';
import { Website } from 'src/websites/website.base';
import { FileSubmission } from '../file-submission/interfaces/file-submission.interface';
import { FileRecord } from '../file-submission/interfaces/file-record.interface';
import { Poster } from './poster';
import { LogService } from '../log/log.service';
import { PostStatus } from './interfaces/post-status.interface';
import { EventsGateway } from 'src/events/events.gateway';
import { PostEvent } from './post.events.enum';
import SubmissionPartEntity from '../submission-part/models/submission-part.entity';
import SubmissionEntity from '../models/submission.entity';
import FileSubmissionEntity from '../file-submission/models/file-submission.entity';

// TODO clear all based on setting on failure
@Injectable()
export class PostService {
  private readonly logger = new Logger(PostService.name);

  private posting: { [key: string]: SubmissionEntity } = {
    [SubmissionType.FILE]: null,
    [SubmissionType.NOTIFICATION]: null,
  };

  private postingParts: { [key: string]: Poster[] } = {
    [SubmissionType.FILE]: [],
    [SubmissionType.NOTIFICATION]: [],
  };

  private submissionQueue: { [key: string]: SubmissionEntity[] } = {
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
    private eventEmitter: EventsGateway,
  ) {}

  queue(submission: SubmissionEntity) {
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
        this.submissionQueue[submission.type].findIndex(s => s._id === submission._id),
        1,
      );
    } else {
      return;
    }

    this.notifyPostingStateChanged();
  }

  isCurrentlyPosting(submission: Submission): boolean {
    return this.posting[submission.type] && this.posting[submission.type]._id === submission._id;
  }

  isCurrentlyPostingToAny(): boolean {
    return !!Object.values(this.posting).filter(post => !!post).length;
  }

  isCurrentlyQueued(submission: Submission): boolean {
    return !!this.submissionQueue[submission.type].find(s => s._id === submission._id);
  }

  getPostingStatus(): PostStatus {
    const posting = [];
    Object.values(this.posting).forEach(submission => {
      if (submission) {
        posting.push({
          submission, // TODO check to see if this fails to return id
          statuses: this.postingParts[submission.type].map(poster => ({
            postAt: poster.postAt,
            success: poster.success,
            done: poster.isDone,
            waitingForCondition: poster.waitForExternalStart,
            website: poster.part.website,
          })),
        });
      }
    });

    return {
      queued: _.flatten(Object.values(this.submissionQueue)),
      posting,
    };
  }

  private insert(submission: SubmissionEntity) {
    if (!this.isCurrentlyQueued(submission)) {
      this.logger.log(submission._id, `Inserting Into Queue ${submission.type}`);
      this.submissionQueue[submission.type].push(submission);
      this.notifyPostingStateChanged();
      this.notifyPostingStatusChanged();
    }
  }

  private isPosting(type: SubmissionType): boolean {
    return !!this.posting[type];
  }

  private async post(submission: SubmissionEntity) {
    this.logger.log(submission._id, 'Posting');
    this.posting[submission.type] = submission; // set here to stop double queue scenario

    // Check for problems
    const validationPackage = await this.submissionService.validate(submission);
    const isValid: boolean = !!_.flatMap(validationPackage.problems, p => p.problems).length;

    if (isValid) {
      if (submission.schedule.isScheduled) {
        this.submissionService.scheduleSubmission(submission._id, false); // Unschedule
      }
      this.notifyPostingStateChanged();
      const parts = await this.partService.getPartsForSubmission(submission._id, false);
      const [defaultPart] = parts.filter(p => p.isDefault);

      // Preload files if they exist
      if (this.isFileSubmission(submission)) {
        await this.preloadFiles(submission);
      }

      // Create posters
      const existingSources = parts.filter(p => p.postedTo).map(p => p.postedTo);
      this.postingParts[submission.type] = parts
        .filter(p => !p.isDefault)
        .filter(p => p.postStatus !== 'SUCCESS')
        .map(p => this.createPoster(submission, p, defaultPart, existingSources));

      // Listen to events
      this.postingParts[submission.type].forEach(poster => {
        poster.once('ready', () => this.notifyPostingStatusChanged());
        poster.once('posting', () => this.notifyPostingStatusChanged());
        poster.once('cancelled', data => this.checkForCompletion(data.submission));
        poster.once('done', data => {
          if (data.source) {
            this.addSource(data.submission.type, data.source);
          }

          if (this.settings.getValue<boolean>('emptyQueueOnFailedPost')) {
            this.emptyQueue(data.submission.type);
          }

          // Save part and then check/notify
          this.partService
            .createOrUpdateSubmissionPart(
              new SubmissionPartEntity({
                ...data.part,
                postStatus: data.success ? 'SUCCESS' : 'FAILED',
                postedTo: data.source,
              }),
              data.submission.type,
            )
            .finally(() => {
              this.notifyPostingStateChanged();
              this.checkForCompletion(data.submission);
            });
        });
      });

      this.checkForCompletion(null);
      this.notifyPostingStatusChanged();
    } else {
      this.posting[submission.type] = null;
      throw new BadRequestException('Submission has problems');
    }
  }

  private addSource(type: SubmissionType, source: string) {
    this.postingParts[type].forEach(poster => {
      poster.addSource(source);
      // Start poster that was waiting for a source
      if (poster.waitForExternalStart) {
        poster.doPost();
      }
    });
  }

  private checkForCompletion(submission: SubmissionEntity) {
    // isDone is set when 'done' is called and 'cancelled'
    const incomplete = this.postingParts[submission.type].filter(poster => !poster.isDone);
    if (incomplete.length) {
      const waitingForExternal = incomplete.filter(poster => poster.waitForExternalStart);

      if (waitingForExternal.length === incomplete.length) {
        // Force post start as no source was found
        waitingForExternal.forEach(poster => poster.doPost());
      }

      this.notifyPostingStatusChanged();
    } else {
      this.logService
        .addLog(
          submission.asPlain(),
          this.postingParts[submission.type]
            .filter(poster => !poster.cancelled)
            .map(poster => ({
              part: {
                ...poster.part.asPlain(),
                postStatus: poster.success ? 'SUCCESS' : 'FAILED',
                postedTo: poster.response.source,
              },
              response: poster.response,
            })),
        )
        .finally(() => {
          // TODO emit notification to UI and OS
          // TODO clear typed queue if failures exist and setting exists
          // Delete submission if 100% completed
          if (!this.postingParts[submission.type].filter(p => !p.success).length) {
            this.submissionService.deleteSubmission(submission._id);
          }
        });

      this.clearAndPostNext(submission.type);
    }
  }

  private async clearAndPostNext(type: SubmissionType) {
    const next = this.submissionQueue[type].pop();
    this.postingParts[type] = [];
    this.posting[type] = null;
    if (next) {
      try {
        this.notifyPostingStatusChanged();
        await this.post(next);
      } catch (err) {
        this.clearAndPostNext(type); // keep searching until there is a valid submission to post
      }
    } else {
      this.notifyPostingStateChanged();
      this.notifyPostingStatusChanged();
    }
  }

  private createPoster(
    submission: SubmissionEntity,
    part: SubmissionPartEntity<any>,
    defaultPart: SubmissionPartEntity<DefaultOptions>,
    sources: string[],
  ): Poster {
    const knownSources = [...sources, ...(part.data.sources || [])];
    return new Poster(
      this.accountService,
      this.settings,
      this.websitesService,
      this.websites.getWebsiteModule(part.website),
      submission,
      part,
      defaultPart,
      this.websites.getWebsiteModule(part.website).acceptsSourceUrls && knownSources.length === 0,
      this.getWaitTime(part.accountId, this.websites.getWebsiteModule(part.website)),
    );
  }

  private emptyQueue(type: SubmissionType) {
    this.submissionQueue[type] = [];
    this.notifyPostingStatusChanged();
    this.notifyPostingStateChanged();
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

  private isFileSubmission(submission: SubmissionEntity): submission is FileSubmissionEntity {
    return submission instanceof FileSubmissionEntity;
  }

  private async preloadFiles(submission: FileSubmissionEntity): Promise<void> {
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
            // TODO do something with this?
          });
      }),
    );
  }

  private notifyPostingStateChanged = _.debounce(
    () => this.submissionService.postingStateChanged(),
    1000,
  );

  private notifyPostingStatusChanged = _.debounce(
    () => this.eventEmitter.emit(PostEvent.UPDATED, this.getPostingStatus()),
    1000,
  );
}
