import { Module } from '@nestjs/common';
import { TagGroupController } from './tag-group.controller';
import { TagGroupService } from './tag-group.service';
import { TagGroupRepositoryToken } from './tag-group.repository';
import { DatabaseFactory } from 'src/database/database.factory';
import TagGroupEntity from './models/tag-group.entity';

@Module({
  controllers: [TagGroupController],
  providers: [
    TagGroupService,
    DatabaseFactory.forProvider(TagGroupRepositoryToken, {
      entity: TagGroupEntity,
      databaseName: 'tag-group',
    }),
  ],
})
export class TagGroupModule {}
