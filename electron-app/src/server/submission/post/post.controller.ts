import _ from 'lodash';
import { Controller, Post, Param, BadRequestException, Get } from '@nestjs/common';
import { PostService } from './post.service';
import { SubmissionService } from '../submission.service';
import { Submission } from 'postybirb-commons';
import { SubmissionType } from 'postybirb-commons';

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
    const validatedSubmission = await this.submissionService.getAndValidate(id);
    if (!!_.flatMap(validatedSubmission.problems, p => p.problems).length) {
      throw new BadRequestException('Cannot queue submission with problems');
    }

    // remove scheduled flag
    if (validatedSubmission.submission.schedule.isScheduled) {
      validatedSubmission.submission.schedule.isScheduled = false;
      await this.submissionService.scheduleSubmission(validatedSubmission.submission, false);
    }

    return this.service.queue(validatedSubmission.submission);
  }

  @Post('cancel/:id')
  async cancel(@Param('id') id: string) {
    return this.service.cancel((await this.submissionService.get(id)) as Submission);
  }

  @Post('clearQueue/:type')
  async cancelAll(@Param('type') type: string) {
    return this.service.emptyQueue(type as SubmissionType);
  }
}
