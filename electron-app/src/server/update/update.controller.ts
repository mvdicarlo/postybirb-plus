import { Controller, Post, Get } from '@nestjs/common';
import { UpdateService } from './update.service';

@Controller('update')
export class UpdateController {
  constructor(private readonly service: UpdateService) {}

  @Get('check')
  checkForUpdate() {
    this.service.checkForUpdate();
  }

  @Get()
  async getUpdateInfo() {
    return this.service.updateInfo();
  }

  @Post()
  async update() {
    return this.service.update();
  }
}
