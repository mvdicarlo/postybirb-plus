import { Controller, Get, Patch, Body, Delete, Param, Post } from '@nestjs/common';
import { TagGroupService } from './tag-group.service';
import { TagGroup } from './tag-group.interface';
import { TagGroupDto } from './tag-group.dto';

@Controller('tag-group')
export class TagGroupController {
  constructor(private readonly service: TagGroupService) {}

  @Get()
  async getAll(): Promise<TagGroup[]> {
    return this.service.getAll();
  }

  @Post()
  async create(@Body() tagGroup: TagGroupDto): Promise<TagGroup> {
    return this.service.create(tagGroup);
  }

  @Patch()
  async update(@Body() tagGroup: TagGroupDto) {
    return this.service.update(tagGroup);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.service.deleteTagGroup(id);
  }
}
