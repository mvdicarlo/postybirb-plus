import { Get, Param, Query, BadRequestException } from '@nestjs/common';
import { Website } from '../website.base';
import { GenericAccountProp } from './generic-account-props.enum';

export class GenericWebsiteController {
  constructor(protected readonly service: Website) {}

  @Get('/info/:id')
  getInfo(@Param('id') id: string, @Query('prop') prop: string) {
    if (!prop) {
      throw new BadRequestException('No prop provided');
    }
    return this.service.getAccountInfo(id, prop);
  }

  @Get('/folders/:id')
  getFolders(@Param('id') id: string) {
    return this.service.getAccountInfo(id, GenericAccountProp.FOLDERS) || [];
  }
}
