import { Controller, Post, Body, Get, Param, Delete, Patch } from '@nestjs/common';
import { SubmissionTemplateService } from './submission-template.service';
import { CreateSubmissionTemplateDto } from './models/create-template.dto';
import { UpdateSubmissionTemplateDto } from './models/update-template.dto';

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
  async create(@Body() createDto: CreateSubmissionTemplateDto) {
    return this.service.create(createDto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.service.remove(id);
  }

  @Patch('update')
  async update(@Body() updateDto: UpdateSubmissionTemplateDto) {
    return this.service.update(updateDto);
  }

  @Patch('rename')
  async updateAlias(@Body() update: { id: string; alias: string }) {
    return this.service.updateAlias(update.id, update.alias);
  }
}
