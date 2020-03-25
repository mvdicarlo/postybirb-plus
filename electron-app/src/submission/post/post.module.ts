import { Module, forwardRef } from '@nestjs/common';
import { PostController } from './post.controller';
import { PostService } from './post.service';
import { AccountModule } from 'src/account/account.module';
import { WebsitesModule } from 'src/websites/websites.module';
import { NotificationModule } from 'src/notification/notification.module';
import { SettingsModule } from 'src/settings/settings.module';
import { SubmissionPartModule } from '../submission-part/submission-part.module';
import { LogModule } from '../log/log.module';
import { SubmissionModule } from '../submission.module';
import { ParserModule } from '../parser/parser.module';

@Module({
  imports: [
    forwardRef(() => SubmissionModule),
    SubmissionModule,
    SettingsModule,
    AccountModule,
    WebsitesModule,
    NotificationModule,
    SubmissionPartModule,
    LogModule,
    ParserModule,
  ],
  controllers: [PostController],
  providers: [PostService],
  exports: [PostService],
})
export class PostModule {}
