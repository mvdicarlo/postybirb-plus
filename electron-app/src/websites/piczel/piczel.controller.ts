import { Controller, Get, Param } from '@nestjs/common';
import { Piczel } from './piczel.service';

@Controller('piczel')
export class PiczelController {
  constructor(private readonly service: Piczel) {}

  @Get('/folders/:id')
  getFolders(@Param('id') id: string) {
    return this.service.getAccountInfo(id, 'folders') || [];
  }
}
