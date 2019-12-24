import { Injectable, Logger, Inject, forwardRef } from '@nestjs/common';
import * as _ from 'lodash';
import { SubmissionService } from '../submission.service';
import { Submission } from '../interfaces/submission.interface';
import { SubmissionType } from '../enums/submission-type.enum';
import { WebsiteProvider } from 'src/websites/website-provider.service';
import { SettingsService } from 'src/settings/settings.service';
import { SubmissionPartService } from '../submission-part/submission-part.service';
import Poster from './poster';

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

  private accountPostTimeMap: { [key: string]: number } = {};

  constructor(
    @Inject(forwardRef(() => SubmissionService))
    private readonly submissionService: SubmissionService,
    private readonly websites: WebsiteProvider,
    private readonly settings: SettingsService,
    private readonly partService: SubmissionPartService,
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
    this.posting[submission.type] = submission;
    this.notifyPostingStateChanged();

    const validationPackage = await this.submissionService.validate(submission);
    const isValid: boolean = !!_.flatMap(validationPackage.problems, p => p.problems).length;

    if (isValid) {
      const parts = await this.partService.getPartsForSubmission(submission.id);
      // TODO create poster parts and listen
    } else {
      // TODO throw
    }
  }

  private notifyPostingStateChanged = _.debounce(
    () => this.submissionService.postingStateChanged(),
    1000,
  );
}
