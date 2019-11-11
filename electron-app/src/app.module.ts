import { Module } from '@nestjs/common';
import { SubmissionController } from './submission/submission.controller';
import { SubmissionService } from './submission/submission.service';
import { FileRepositoryService } from './file-repository/file-repository.service';
import { EventsGateway } from './events/events.gateway';


@Module({
  imports: [],
  controllers: [SubmissionController],
  providers: [SubmissionService, FileRepositoryService, EventsGateway],
})
export class AppModule {}
