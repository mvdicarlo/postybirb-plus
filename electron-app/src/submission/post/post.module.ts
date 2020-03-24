import { Module, forwardRef } from '@nestjs/common';
import { PostController } from './post.controller';
import { PostService } from './post.service';
import { AccountModule } from 'src/account/account.module';
import { WebsitesModule } from 'src/websites/websites.module';
import { NotificationModule } from 'src/notification/notification.module';
import { FileManipulationModule } from 'src/file-manipulation/file-manipulation.module';
import { SettingsModule } from 'src/settings/settings.module';
import { SubmissionPartModule } from '../submission-part/submission-part.module';
import { LogModule } from '../log/log.module';
import { SubmissionModule } from '../submission.module';

@Module({
  imports: [
    forwardRef(() => SubmissionModule),
    SubmissionModule,
    FileManipulationModule,
    SettingsModule,
    AccountModule,
    WebsitesModule,
    NotificationModule,
    SubmissionPartModule,
    LogModule,
  ],
  controllers: [PostController],
  providers: [PostService],
  exports: [PostService],
})
export class PostModule {}
