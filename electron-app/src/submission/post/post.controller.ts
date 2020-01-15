import * as _ from 'lodash';
import { Controller, Post, Param, BadRequestException, Get } from '@nestjs/common';
import { PostService } from './post.service';
import { SubmissionService } from '../submission.service';
import { SubmissionPackage } from '../interfaces/submission-package.interface';
import { Submission } from '../interfaces/submission.interface';
import SubmissionEntity from '../models/submission.entity';
import { SubmissionType } from '../enums/submission-type.enum';

@Controller('post')
export class PostController {
  constructor(
    private readonly service: PostService,
    private readonly submissionService: SubmissionService,
  ) {}

  @Get('status')
  async getStatus() {
    return this.service.getPostingStatus();
  }

  @Post('queue/:id')
  async queue(@Param('id') id: string) {
    const validatedSubmission = (await this.submissionService.get(id, true)) as SubmissionPackage<
      SubmissionEntity
    >;
    if (!!_.flatMap(validatedSubmission.problems, p => p.problems).length) {
      throw new BadRequestException('Cannot queue submission with problems');
    }

    // remove scheduled flag
    if (validatedSubmission.submission.schedule.isScheduled) {
      validatedSubmission.submission.schedule.isScheduled = false;
      await this.submissionService.scheduleSubmission(id, false); // somewhat inefficient
    }

    return this.service.queue(validatedSubmission.submission);
  }

  @Post('cancel/:id')
  async cancel(@Param('id') id: string) {
    return this.service.cancel((await this.submissionService.get(id)) as Submission);
  }

  @Post('cancelAll/:type')
  async cancelAll(@Param('type') type: SubmissionType) {
    return this.service.emptyQueue(type);
  }
}
