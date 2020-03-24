import { Module, forwardRef } from '@nestjs/common';
import { SubmissionModule } from 'src/submission/submission.module';
import { WebsitesModule } from 'src/websites/websites.module';

import { AccountController } from './account.controller';
import { AccountService } from './account.service';
import { AccountRepositoryToken } from './account.repository';
import { DatabaseFactory } from 'src/database/database.factory';
import UserAccountEntity from './models/user-account.entity';
import { SubmissionPartModule } from 'src/submission/submission-part/submission-part.module';
import { SubmissionTemplateModule } from 'src/submission/submission-template/submission-template.module';

@Module({
  imports: [
    forwardRef(() => SubmissionModule),
    SubmissionPartModule,
    SubmissionTemplateModule,
    WebsitesModule,
  ],
  controllers: [AccountController],
  providers: [
    AccountService,
    DatabaseFactory.forProvider(AccountRepositoryToken, {
      databaseName: 'accounts',
      entity: UserAccountEntity,
    }),
  ],
  exports: [AccountService],
})
export class AccountModule {}
