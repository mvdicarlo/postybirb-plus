import { Module } from '@nestjs/common';
import { DescriptionTemplateController } from './description-template.controller';
import { DescriptionTemplateService } from './description-template.service';
import { DescriptionTemplateDatabaseToken } from './description-template.repository';
import { DatabaseFactory } from 'src/database/database.factory';
import DescriptionTemplateEntity from './models/description-template.entity';

@Module({
  controllers: [DescriptionTemplateController],
  providers: [
    DescriptionTemplateService,
    DatabaseFactory.forProvider(DescriptionTemplateDatabaseToken, {
      entity: DescriptionTemplateEntity,
      databaseName: 'description-template',
    }),
  ],
})
export class DescriptionTemplateModule {}
