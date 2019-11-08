import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { SubmissionController } from './submission/submission.controller';
import { SubmissionService } from './submission/submission.service';
import { FileRepositoryService } from './file-repository/file-repository.service';

@Module({
  imports: [],
  controllers: [AppController, SubmissionController],
  providers: [AppService, SubmissionService, FileRepositoryService],
})
export class AppModule {}
