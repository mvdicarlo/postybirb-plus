import { Get, Param, Query } from '@nestjs/common';
import { Website } from '../website.base';

export class GenericWebsiteController {
  constructor(protected readonly service: Website) {}

  @Get('/info/:id')
  getInfo(@Param('id') id: string, @Query('prop') prop: string) {
    return this.service.getAccountInfo(id, prop);
  }

  @Get('/folders/:id')
  getFolders(@Param('id') id: string) {
    return this.service.getAccountInfo(id, 'folders') || [];
  }
}
