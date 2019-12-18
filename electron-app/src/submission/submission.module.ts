import { Module } from '@nestjs/common';
import { FileRepositoryModule } from 'src/file-repository/file-repository.module';
import { WebsitesModule } from 'src/websites/websites.module';

import { FileSubmissionService } from './file-submission/file-submission.service';
import { SubmissionController } from './submission.controller';
import { SubmissionPartRepository } from './submission-part/submission-part.repository';
import { SubmissionPartService } from './submission-part/submission-part.service';
import { SubmissionRepository } from './submission.repository';
import { SubmissionService } from './submission.service';
import { ValidatorService } from './validator/validator.service';

@Module({
  imports: [FileRepositoryModule, WebsitesModule],
  controllers: [SubmissionController],
  providers: [
    FileSubmissionService,
    SubmissionPartRepository,
    SubmissionPartService,
    SubmissionRepository,
    SubmissionService,
    ValidatorService,
  ],
  exports: [SubmissionService, SubmissionPartService],
})
export class SubmissionModule {}
