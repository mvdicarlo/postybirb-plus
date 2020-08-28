import { Module } from '@nestjs/common';
import { SubmissionPartService } from './submission-part.service';
import { DatabaseFactory } from 'src/server/database/database.factory';
import SubmissionPartEntity from './models/submission-part.entity';
import { SubmissionPartRepositoryToken } from './submission-part.repository';
import { WebsitesModule } from 'src/server/websites/websites.module';

@Module({
  imports: [WebsitesModule],
  providers: [
    SubmissionPartService,
    DatabaseFactory.forProvider(SubmissionPartRepositoryToken, {
      databaseName: 'submission-part',
      entity: SubmissionPartEntity,
    }),
  ],
  exports: [SubmissionPartService],
})
export class SubmissionPartModule {}
