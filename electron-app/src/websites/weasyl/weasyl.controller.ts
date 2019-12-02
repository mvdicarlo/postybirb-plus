import { Controller, Get, Param } from '@nestjs/common';
import { Weasyl } from './weasyl.service';

@Controller('weasyl')
export class WeasylController {
  constructor(private readonly service: Weasyl) {}

  @Get('/info/:id')
  getFolders(@Param('id') id: string) {
    return this.service.getAccountInfo(id);
  }
}
