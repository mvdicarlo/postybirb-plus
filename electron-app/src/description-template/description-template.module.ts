import { Module } from '@nestjs/common';
import { DescriptionTemplateController } from './description-template.controller';
import { DescriptionTemplateService } from './description-template.service';
import { DescriptionTemplateRepository } from './description-template.repository';

@Module({
  controllers: [DescriptionTemplateController],
  providers: [DescriptionTemplateService, DescriptionTemplateRepository],
})
export class DescriptionTemplateModule {}
