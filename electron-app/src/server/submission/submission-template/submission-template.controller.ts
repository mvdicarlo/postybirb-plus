import { Controller, Post, Body, Get, Param, Delete, Patch } from '@nestjs/common';
import { SubmissionTemplateService } from './submission-template.service';
import { CreateSubmissionTemplateModel } from './models/create-template.model';
import { UpdateSubmissionTemplateModel } from './models/update-template.model';

@Controller('submission-template')
export class SubmissionTemplateController {
  constructor(private readonly service: SubmissionTemplateService) {}

  @Get()
  async getAll() {
    return this.service.getAll();
  }

  @Get(':id')
  async getById(@Param('id') id: string) {
    return this.service.get(id);
  }

  @Post('create')
  async create(@Body() createDto: CreateSubmissionTemplateModel) {
    return this.service.create(createDto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.service.remove(id);
  }

  @Patch('update')
  async update(@Body() updateDto: UpdateSubmissionTemplateModel) {
    return this.service.update(updateDto);
  }

  @Patch('rename')
  async updateAlias(@Body() update: { id: string; alias: string }) {
    return this.service.updateAlias(update.id, update.alias);
  }
}
