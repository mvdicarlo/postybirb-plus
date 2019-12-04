import { Module } from '@nestjs/common';
import { FileSubmissionController } from './submission/file-submission/file-submission.controller';
import { FileSubmissionService } from './submission/file-submission/file-submission.service';
import { FileRepositoryService } from './file-repository/file-repository.service';
import { AccountController } from './account/account.controller';
import { AccountService } from './account/account.service';
import { AccountRepository } from './account/account.repository';
import { WebsitesModule } from './websites/websites.module';
import { ValidatorService } from './submission/validator/validator.service';
import { SubmissionPartService } from './submission/submission-part/submission-part.service';
import { SubmissionPartRepository } from './submission/submission-part/submission-part.repository';
import { TagGroupModule } from './tag-group/tag-group.module';
import { EventsModule } from './events/events.module';
import { SubmissionController } from './submission/submission.controller';
import { SubmissionService } from './submission/submission.service';
import { SubmissionRepository } from './submission/submission.repository';

@Module({
  imports: [WebsitesModule, TagGroupModule, EventsModule],
  controllers: [FileSubmissionController, AccountController, SubmissionController],
  providers: [
    FileSubmissionService,
    FileRepositoryService,
    SubmissionRepository,
    AccountService,
    AccountRepository,
    ValidatorService,
    SubmissionPartService,
    SubmissionPartRepository,
    SubmissionService,
  ],
})
export class AppModule {}
