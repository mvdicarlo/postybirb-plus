import { Module } from '@nestjs/common';
import { LogController } from './log.controller';
import { LogService } from './log.service';
import { DatabaseFactory } from 'src/server/database/database.factory';
import { SubmissionLogRepositoryToken } from './log.repository';
import SubmissionLogEntity from './models/submission-log.entity';
import { SubmissionPartModule } from '../submission-part/submission-part.module';

@Module({
  imports: [SubmissionPartModule],
  controllers: [LogController],
  providers: [
    LogService,
    DatabaseFactory.forProvider(SubmissionLogRepositoryToken, {
      databaseName: 'submission-logs',
      entity: SubmissionLogEntity,
    }),
  ],
  exports: [LogService],
})
export class LogModule {}
