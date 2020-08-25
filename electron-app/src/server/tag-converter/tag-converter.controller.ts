import { Controller, Get, Post, Body, Patch, Delete, Param } from '@nestjs/common';
import { TagConverterService } from './tag-converter.service';
import TagConverterEntity from './models/tag-converter.entity';

@Controller('tag-converter')
export class TagConverterController {
  constructor(private readonly service: TagConverterService) {}

  @Get()
  async getAll() {
    return this.service.getAll();
  }

  @Post('create')
  async create(@Body() customShortcutDto: TagConverterEntity) {
    return this.service.create(customShortcutDto);
  }

  @Patch('update')
  async update(@Body() updateDto: TagConverterEntity) {
    return this.service.update(updateDto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
