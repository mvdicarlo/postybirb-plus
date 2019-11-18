import { Module } from '@nestjs/common';
import { FileSubmissionController } from './submission/file-submission/file-submission.controller';
import { FileSubmissionService } from './submission/file-submission/file-submission.service';
import { FileRepositoryService } from './file-repository/file-repository.service';
import { EventsGateway } from './events/events.gateway';
import { AccountController } from './account/account.controller';
import { AccountService } from './account/account.service';
import { AccountRepository } from './account/account.repository';
import { FileSubmissionRepository } from './submission/file-submission/file-submission.repository';
import { WebsitesModule } from './websites/websites.module';
import { ValidatorService } from './submission/validator/validator.service';
import { SubmissionPartService } from './submission/submission-part/submission-part.service';
import { SubmissionPartRepository } from './submission/submission-part/submission-part.repository';

@Module({
  imports: [WebsitesModule],
  controllers: [FileSubmissionController, AccountController],
  providers: [
    FileSubmissionService,
    FileRepositoryService,
    FileSubmissionRepository,
    EventsGateway,
    AccountService,
    AccountRepository,
    ValidatorService,
    SubmissionPartService,
    SubmissionPartRepository,
  ],
})
export class AppModule {}
