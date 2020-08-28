import { Module, forwardRef } from '@nestjs/common';
import { FileManagerModule } from 'src/server/file-manager/file-manager.module';
import { WebsitesModule } from 'src/server/websites/websites.module';
import { FileManipulationModule } from 'src/server/file-manipulation/file-manipulation.module';
import { AccountModule } from 'src/server//account/account.module';

import { FileSubmissionService } from './file-submission/file-submission.service';
import { SubmissionController } from './submission.controller';
import { SubmissionRepositoryToken } from './submission.repository';
import { SubmissionService } from './submission.service';
import { SubmissionTemplateController } from './submission-template/submission-template.controller';
import { ValidatorModule } from './validator/validator.module';
import { SubmissionPartModule } from './submission-part/submission-part.module';
import { PostModule } from './post/post.module';
import { SubmissionTemplateModule } from './submission-template/submission-template.module';
import { DatabaseFactory } from 'src/server/database/database.factory';
import { ParserModule } from './parser/parser.module';
import SubmissionEntity from './models/submission.entity';
import FileSubmissionEntity from './file-submission/models/file-submission.entity';

@Module({
  imports: [
    FileManagerModule,
    WebsitesModule,
    forwardRef(() => AccountModule),
    forwardRef(() => PostModule),
    FileManipulationModule,
    ValidatorModule,
    SubmissionPartModule,
    SubmissionTemplateModule,
    ParserModule,
  ],
  controllers: [SubmissionController],
  providers: [
    FileSubmissionService,
    SubmissionService,
    DatabaseFactory.forProvider(SubmissionRepositoryToken, {
      databaseName: 'submissions',
      entity: SubmissionEntity,
      descriminator: (entity: any) => {
        return entity.primary ? FileSubmissionEntity : SubmissionEntity;
      },
    }),
  ],
  exports: [SubmissionService],
})
export class SubmissionModule {}
