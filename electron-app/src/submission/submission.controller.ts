import {
  Controller,
  Get,
  Post,
  UseInterceptors,
  UploadedFile,
  Param,
  Delete,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { SubmissionService } from './submission.service';
import { Submission } from './submission.interface';

@Controller('submission')
export class SubmissionController {
  constructor(private readonly service: SubmissionService) {}

  @Get()
  findAll(): Submission[] {
    return this.service.getAllSubmissions();
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
      this.service.removeSubmission(id);
  }

  @Post('create/:path')
  @UseInterceptors(FileInterceptor('file'))
  async create(@UploadedFile() file, @Param() params) {
    await this.service.createSubmission(file, params.path);
  }
}
