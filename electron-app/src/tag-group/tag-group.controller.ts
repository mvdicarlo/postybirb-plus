import { Controller, Get, Patch, Body, Delete, Param, Post } from '@nestjs/common';
import { TagGroupService } from './tag-group.service';
import TagGroupEntity from './models/tag-group.entity';

@Controller('tag-group')
export class TagGroupController {
  constructor(private readonly service: TagGroupService) {}

  @Get()
  async getAll(): Promise<TagGroupEntity[]> {
    return this.service.getAll();
  }

  @Post('create')
  async create(@Body() tagGroup: TagGroupEntity): Promise<TagGroupEntity> {
    return this.service.create(tagGroup);
  }

  @Patch('update')
  async update(@Body() tagGroup: TagGroupEntity) {
    return this.service.update(tagGroup);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
