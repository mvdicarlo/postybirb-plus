import { Get, Param } from '@nestjs/common';
import { Website } from '../website.base';

export class GenericWebsiteController {
  constructor(protected readonly service: Website) {}

  @Get('/info/:id')
  getInfo(@Param('id') id: string) {
    return this.service.getAccountInfo(id);
  }

  @Get('/folders/:id')
  getFolders(@Param('id') id: string) {
    return this.service.getAccountInfo(id, 'folders') || [];
  }
}
