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
import { FileSubmissionService } from './file-submission.service';
import { Submission } from '../submission.interface';

@Controller('file_submission')
export class FileSubmissionController {
  constructor(private readonly service: FileSubmissionService) {}

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
