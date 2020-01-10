import { Controller, Get, Post, Body, Patch, Delete, Param } from '@nestjs/common';
import { DescriptionTemplateService } from './description-template.service';
import DescriptionTemplateEntity from './models/description-template.entity';

@Controller('description-template')
export class DescriptionTemplateController {
  constructor(private readonly service: DescriptionTemplateService) {}

  @Get()
  async getAll() {
    return this.service.getAll();
  }

  @Post('create')
  async create(@Body() descriptionTemplateDto: DescriptionTemplateEntity) {
    return this.service.create(descriptionTemplateDto);
  }

  @Patch('update')
  async update(@Body() tagGroup: DescriptionTemplateEntity) {
    return this.service.update(tagGroup);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
