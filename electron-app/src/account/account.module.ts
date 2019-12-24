import { Module, forwardRef } from '@nestjs/common';
import { SubmissionModule } from 'src/submission/submission.module';
import { WebsitesModule } from 'src/websites/websites.module';

import { AccountController } from './account.controller';
import { AccountService } from './account.service';
import { AccountRepository } from './account.repository';

@Module({
  imports: [forwardRef(() => SubmissionModule), WebsitesModule],
  controllers: [AccountController],
  providers: [AccountService, AccountRepository],
  exports: [AccountService],
})
export class AccountModule {}
