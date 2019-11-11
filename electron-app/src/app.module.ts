import { Module } from '@nestjs/common';
import { FileSubmissionController } from './submission/file-submission/file-submission.controller';
import { FileSubmissionService } from './submission/file-submission/file-submission.service';
import { FileRepositoryService } from './file-repository/file-repository.service';
import { EventsGateway } from './events/events.gateway';

@Module({
  imports: [],
  controllers: [FileSubmissionController],
  providers: [FileSubmissionService, FileRepositoryService, EventsGateway],
})
export class AppModule {}
