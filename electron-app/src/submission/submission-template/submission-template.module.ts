import { Module } from '@nestjs/common';
import { SubmissionTemplateController } from './submission-template.controller';
import { SubmissionTemplateService } from './submission-template.service';
import { DatabaseFactory } from 'src/database/database.factory';
import SubmissionTemplateEntity from './models/submission-template.entity';
import { SubmissionTemplateRepositoryToken } from './submission-template.repository';

@Module({
  controllers: [SubmissionTemplateController],
  providers: [
    SubmissionTemplateService,
    DatabaseFactory.forProvider(SubmissionTemplateRepositoryToken, {
      databaseName: 'submission-templates',
      entity: SubmissionTemplateEntity,
    }),
  ],
  exports: [SubmissionTemplateService],
})
export class SubmissionTemplateModule {}
