import { Module, forwardRef } from '@nestjs/common';
import { SubmissionImporterService } from './submission-importer.service';
import { SubmissionModule } from '../submission.module';
import { NotificationModule } from '../../notification/notification.module';

@Module({
  imports: [forwardRef(() => SubmissionModule), NotificationModule],
  providers: [SubmissionImporterService],
  exports: [SubmissionImporterService],
})
export class SubmissionImporterModule {}
