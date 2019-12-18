import { Module } from '@nestjs/common';
import { SubmissionModule } from 'src/submission/submission.module';
import { WebsitesModule } from 'src/websites/websites.module';

import { AccountController } from './account.controller';
import { AccountService } from './account.service';
import { AccountRepository } from './account.repository';

@Module({
  imports: [SubmissionModule, WebsitesModule],
  controllers: [AccountController],
  providers: [AccountService, AccountRepository],
})
export class AccountModule {}
