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
import { Website } from 'src/websites/website.base';
import { FileRecord } from '../file-submission/interfaces/file-record.interface';
import { Poster } from './poster';
import { LogService } from '../log/log.service';
import { PostStatuses, PostInfo } from './interfaces/post-status.interface';
import { EventsGateway } from 'src/events/events.gateway';
import { PostEvent } from './enums/post.events.enum';
import SubmissionPartEntity from '../submission-part/models/submission-part.entity';
import SubmissionEntity from '../models/submission.entity';
import FileSubmissionEntity from '../file-submission/models/file-submission.entity';
import { nativeImage } from 'electron';
import { NotificationService } from 'src/notification/notification.service';
import { NotificationType } from 'src/notification/enums/notification-type.enum';
import { UiNotificationService } from 'src/notification/ui-notification/ui-notification.service';
import { ParserService } from '../parser/parser.service';

@Injectable()
export class PostService {
  private readonly logger = new Logger(PostService.name);

  private posting: Record<string, SubmissionEntity> = {
    [SubmissionType.FILE]: null,
    [SubmissionType.NOTIFICATION]: null,
  };

  private postingParts: Record<string, Poster[]> = {
    [SubmissionType.FILE]: [],
    [SubmissionType.NOTIFICATION]: [],
  };

  private submissionQueue: Record<string, SubmissionEntity[]> = {
    [SubmissionType.FILE]: [],
    [SubmissionType.NOTIFICATION]: [],
  };

  // TODO save this somewhere
  private accountPostTimeMap: Record<string, number> = {};

  constructor(
    @Inject(forwardRef(() => SubmissionService))
    private readonly submissionService: SubmissionService,
    private readonly accountService: AccountService,
    private readonly parserService: ParserService,
    private readonly websites: WebsiteProvider,
    private readonly settings: SettingsService,
    private readonly partService: SubmissionPartService,
    private readonly logService: LogService,
    private readonly eventEmitter: EventsGateway,
    private readonly notificationService: NotificationService,
    private readonly uiNotificationService: UiNotificationService,
  ) {}

  queue(submission: SubmissionEntity) {
    this.logger.log(submission, 'Queueing');
    if (!this.isPosting(submission.type)) {
      this.post(submission).catch(() => {
        if (this.settings.getValue<boolean>('emptyQueueOnFailedPost')) {
          if (!this.hasAnyQueued(submission.type)) {
            return;
          }
          this.emptyQueue(submission.type);
          this.notificationService.create({
            type: NotificationType.WARNING,
            body: `${_.capitalize(
              submission.type,
            )} queue was emptied due to a failure or because there were problems with ${
              submission.title
            }.\n\nYou can change this behavior in your settings.`,
            title: `${_.capitalize(submission.type)} Queue Cleared`,
          });
          this.uiNotificationService.createUINotification(
            NotificationType.WARNING,
            10,
            `${_.capitalize(
              submission.type,
            )} queue was emptied due to a failure or because there were problems with ${
              submission.title
            }.\n\nYou can change this behavior in your settings.`,
            `${_.capitalize(submission.type)} Queue Cleared`,
          );
        }
      });
    } else {
      this.insert(submission);
    }
  }

  cancel(submission: Submission) {
    if (this.isCurrentlyPosting(submission)) {
      // Need to handle cancel event
      this.getPosters(submission.type).forEach(poster => poster.cancel());
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
    return !!(
      this.posting[submission.type] && this.posting[submission.type]._id === submission._id
    );
  }

  isCurrentlyPostingToAny(): boolean {
    return !!Object.values(this.posting).filter(post => !!post).length;
  }

  isCurrentlyQueued(submission: Submission): boolean {
    return !!this.submissionQueue[submission.type].find(s => s._id === submission._id);
  }

  hasAnyQueued(type: SubmissionType): boolean {
    return !!this.submissionQueue[type].length;
  }

  getPostingStatus(): PostStatuses {
    const posting: PostInfo[] = [];
    Object.values(this.posting).forEach(submission => {
      if (submission) {
        posting.push({
          submission,
          statuses: this.getPosters(submission.type).map(poster => ({
            postAt: poster.postAt,
            status: poster.status,
            waitingForCondition: poster.waitForExternalStart,
            website: poster.part.website,
            accountId: poster.part.accountId,
            source: poster.getSource(),
            error: poster.getFullResponse().error,
            isPosting: poster.isPosting,
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
    if (!this.isCurrentlyQueued(submission) && !this.isCurrentlyPosting(submission)) {
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
    const isValid: boolean = !_.flatMap(validationPackage.problems, p => p.problems).length;

    if (isValid) {
      if (submission.schedule.isScheduled) {
        this.submissionService.scheduleSubmission(submission._id, false); // Unschedule
      }
      this.notifyPostingStateChanged();
      this.notifyPostingStatusChanged();
      const parts = await this.partService.getPartsForSubmission(submission._id, false);
      const [defaultPart] = parts.filter(p => p.isDefault);

      // Preload files if they exist
      const postingSubmission = submission.copy();
      if (this.isFileSubmission(postingSubmission)) {
        await this.preloadFiles(postingSubmission);
      }

      // Create posters
      const existingSources = parts.filter(p => p.postedTo).map(p => p.postedTo);
      this.postingParts[postingSubmission.type] = parts
        .filter(p => !p.isDefault)
        .filter(p => p.postStatus !== 'SUCCESS')
        .map(p => this.createPoster(postingSubmission, p, defaultPart, existingSources));

      // Listen to events
      this.getPosters(postingSubmission.type).forEach(poster => {
        poster.once('ready', () => this.notifyPostingStatusChanged());
        poster.once('posting', () => this.notifyPostingStatusChanged());
        poster.once('cancelled', data => this.checkForCompletion(data.submission));
        poster.once('done', data => {
          if (data.source) {
            this.addSource(submission.type, data.source);
          }

          if (data.status === 'SUCCESS') {
            this.accountPostTimeMap[`${data.part.accountId}-${data.part.website}`] = Date.now();
          }

          // if (this.settings.getValue<boolean>('emptyQueueOnFailedPost')) {
          //   this.emptyQueue(submission.type);
          // }

          // Save part and then check/notify
          this.partService
            .createOrUpdateSubmissionPart(
              new SubmissionPartEntity({
                ...data.part,
                postStatus: data.status,
                postedTo: data.source,
              }),
              submission.type,
            )
            .finally(() => {
              this.notifyPostingStateChanged();
              this.notifyPostingStatusChanged();
              this.checkForCompletion(submission); // use base submission to avoid preloaded buffers
            });
        });
      });

      this.checkForCompletion(submission); // use base submission to avoid preloaded buffers
      this.notifyPostingStatusChanged();
    } else {
      this.posting[submission.type] = null;
      // TODO do something with this throw and notify
      // notify ui
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
    const posters = this.getPosters(submission.type);
    const incomplete = posters.filter(poster => !poster.isDone);
    if (incomplete.length) {
      const waitingForExternal = incomplete.filter(poster => poster.waitForExternalStart);

      if (waitingForExternal.length === incomplete.length) {
        // Force post start as no source was found
        waitingForExternal.forEach(poster => poster.doPost());
      }
    } else {
      this.logService
        .addLog(
          submission.asPlain(),
          posters
            .filter(poster => poster.status !== 'CANCELLED')
            .map(poster => ({
              part: {
                ...poster.part.asPlain(),
                postStatus: poster.status,
                postedTo: poster.getSource(),
              },
              response: poster.getFullResponse(),
            })),
        )
        .finally(() => {
          const canDelete: boolean =
            posters.length === posters.filter(p => p.status === 'SUCCESS').length;
          if (canDelete) {
            const body = `Posted (${_.capitalize(submission.type)}) ${submission.title}`; // may want to make body more dynamic to title
            this.notificationService.create(
              {
                type: NotificationType.SUCCESS,
                body,
                title: 'Post Success',
              },
              submission instanceof FileSubmissionEntity
                ? nativeImage.createFromPath(submission.primary.preview)
                : undefined,
            );
            this.submissionService.deleteSubmission(submission._id, true);
          } else {
            const body = posters
              .filter(p => p.status === 'FAILED')
              .map(p => p.getMessage())
              .join('\n');
            if (body) {
              this.notificationService.create(
                {
                  type: NotificationType.ERROR,
                  body,
                  title: `Post Failure: (${_.capitalize(submission.type)}) ${submission.title}`,
                },
                submission instanceof FileSubmissionEntity
                  ? nativeImage.createFromPath(submission.primary.preview)
                  : undefined,
              );
            }

            this.uiNotificationService.createUINotification(
              NotificationType.ERROR,
              20,
              posters.map(p => p.getMessage()).join('\n'),
              `Post Failure: ${submission.title}`,
            );
          }
        });

      if (this.settings.getValue<boolean>('emptyQueueOnFailedPost')) {
        // If the failures were not cancels
        const shouldEmptyQueue: boolean = !!posters.filter(p => p.status === 'FAILED').length;
        if (shouldEmptyQueue) {
          this.clearQueueIfRequired(submission);
        }
      }

      this.clearAndPostNext(submission.type);
    }
  }

  private async clearAndPostNext(type: SubmissionType) {
    const next = this.submissionQueue[type][0];
    this.postingParts[type] = [];
    this.posting[type] = null;
    if (next) {
      this.submissionQueue[type].shift();
      try {
        this.notifyPostingStatusChanged();
        await this.post(next);
      } catch (err) {
        this.clearQueueIfRequired(next);
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
      this.parserService,
      this.settings,
      this.websites.getWebsiteModule(part.website),
      submission,
      part,
      defaultPart,
      this.websites.getWebsiteModule(part.website).acceptsSourceUrls && knownSources.length === 0,
      this.getWaitTime(part.accountId, this.websites.getWebsiteModule(part.website)),
    );
  }

  private clearQueueIfRequired(submission: Submission) {
    if (this.settings.getValue<boolean>('emptyQueueOnFailedPost')) {
      if (!this.hasAnyQueued(submission.type)) {
        return;
      }
      this.emptyQueue(submission.type);
      this.notificationService.create(
        {
          type: NotificationType.WARNING,
          body: `${_.capitalize(
            submission.type,
          )} queue was emptied due to a failure to post.\n\nYou can change this behavior in your settings.`,
          title: `${_.capitalize(submission.type)} Queue Cleared`,
        },
        submission instanceof FileSubmissionEntity
          ? nativeImage.createFromPath(submission.primary.preview)
          : undefined,
      );
      this.uiNotificationService.createUINotification(
        NotificationType.WARNING,
        0,
        `${_.capitalize(
          submission.type,
        )} queue was emptied due to a failure to post.\n\nYou can change this behavior in your settings.`,
        `${_.capitalize(submission.type)} Queue Cleared`,
      );
    }
  }

  emptyQueue(type: SubmissionType) {
    this.logger.debug(`Emptying Queue ${type}`);
    this.submissionQueue[type] = [];
    this.notifyPostingStatusChanged();
    this.notifyPostingStateChanged();
  }

  private getPosters(type: SubmissionType): Poster[] {
    return this.postingParts[type] || [];
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
      return 5000;
    } else {
      return Math.max(Math.abs(timeDifference - timeToWait), 5000);
    }
  }

  private isFileSubmission(submission: SubmissionEntity): submission is FileSubmissionEntity {
    return submission instanceof FileSubmissionEntity;
  }

  private async preloadFiles(submission: FileSubmissionEntity): Promise<void> {
    const files: FileRecord[] = _.compact([
      submission.primary,
      submission.thumbnail,
      submission.fallback,
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
    100,
  );

  private notifyPostingStatusChanged() {
    this.eventEmitter.emit(PostEvent.UPDATED, this.getPostingStatus());
  }
}
