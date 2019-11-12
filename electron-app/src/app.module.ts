import { Module } from '@nestjs/common';
import { FileSubmissionController } from './submission/file-submission/file-submission.controller';
import { FileSubmissionService } from './submission/file-submission/file-submission.service';
import { FileRepositoryService } from './file-repository/file-repository.service';
import { EventsGateway } from './events/events.gateway';
import { AccountController } from './account/account.controller';
import { AccountService } from './account/account.service';
import { AccountRepository } from './account/account.repository';
import { FileSubmissionRepository } from './submission/file-submission/file-submission.repository';

@Module({
  imports: [],
  controllers: [FileSubmissionController, AccountController],
  providers: [
    FileSubmissionService,
    FileRepositoryService,
    FileSubmissionRepository,
    EventsGateway,
    AccountService,
    AccountRepository,
  ],
})
export class AppModule {}
