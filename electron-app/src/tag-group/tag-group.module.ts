import { Module } from '@nestjs/common';
import { TagGroupController } from './tag-group.controller';
import { TagGroupService } from './tag-group.service';
import { TagGroupRepository } from './tag-group.repository';

@Module({
  controllers: [TagGroupController],
  providers: [TagGroupService, TagGroupRepository],
})
export class TagGroupModule {}
