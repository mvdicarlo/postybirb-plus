import { Module } from '@nestjs/common';
import { DescriptionTemplateController } from './description-template.controller';
import { DescriptionTemplateService } from './description-template.service';
import { DescriptionTemplateRepositoryToken } from './description-template.repository';
import { DatabaseFactory } from 'src/database/database.factory';
import DescriptionTemplateEntity from './models/description-template.entity';

@Module({
  controllers: [DescriptionTemplateController],
  providers: [
    DescriptionTemplateService,
    DatabaseFactory.forProvider(DescriptionTemplateRepositoryToken, {
      entity: DescriptionTemplateEntity,
      databaseName: 'description-template',
    }),
  ],
})
export class DescriptionTemplateModule {}
