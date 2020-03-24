import { Controller, Get, Post, Body, Patch, Delete, Param } from '@nestjs/common';
import { CustomShortcutService } from './custom-shortcut.service';
import CustomShortcutEntity from './models/custom-shortcut.entity';

@Controller('custom-shortcut')
export class CustomShortcutController {
  constructor(private readonly service: CustomShortcutService) {}

  @Get()
  async getAll() {
    return this.service.getAll();
  }

  @Post('create')
  async create(@Body() customShortcutDto: CustomShortcutEntity) {
    return this.service.create(customShortcutDto);
  }

  @Patch('update')
  async update(@Body() updateDto: CustomShortcutEntity) {
    return this.service.update(updateDto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
