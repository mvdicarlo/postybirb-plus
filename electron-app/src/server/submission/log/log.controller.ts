import { Controller, Get, Param } from '@nestjs/common';
import { LogService } from './log.service';
import { SubmissionType } from 'postybirb-commons';

@Controller('submission-log')
export class LogController {
  constructor(private readonly service: LogService) {}

  @Get(':type')
  async logs(@Param('type') type: SubmissionType) {
    return this.service.getLogs(type);
  }
}
