import { Module } from '@nestjs/common';
import { TagConverterController } from './tag-converter.controller';
import { TagConverterService } from './tag-converter.service';
import { TagConverterRepositoryToken } from './tag-converter.repository';
import TagConverterEntity from './models/tag-converter.entity';
import { DatabaseFactory } from 'src/database/database.factory';

@Module({
  controllers: [TagConverterController],
  providers: [
    TagConverterService,
    DatabaseFactory.forProvider(TagConverterRepositoryToken, {
      entity: TagConverterEntity,
      databaseName: 'tag-converter',
    }),
  ],
})
export class TagConverterModule {}
