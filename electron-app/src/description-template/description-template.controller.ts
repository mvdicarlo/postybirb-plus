import { Controller, Get, Post, Body, Patch, Delete, Param } from '@nestjs/common';
import { DescriptionTemplateService } from './description-template.service';
import { DescriptionTemplateDto } from './description-template.dto';

@Controller('description-template')
export class DescriptionTemplateController {
  constructor(private readonly service: DescriptionTemplateService) {}

  @Get()
  async getAll() {
    return this.service.getAll();
  }

  @Post()
  async create(@Body() descriptionTemplateDto: DescriptionTemplateDto) {
    return this.service.create(descriptionTemplateDto);
  }

  @Patch()
  async update(@Body() tagGroup: DescriptionTemplateDto) {
    return this.service.update(tagGroup);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
