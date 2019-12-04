import {
  Controller,
  Get,
  Post,
  UseInterceptors,
  UploadedFile,
  Param,
  Delete,
  Body,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { FileSubmissionService } from './file-submission.service';
import { SubmissionPart } from '../interfaces/submission-part.interface';
import { FileSubmission } from './interfaces/file-submission.interface';
import { SubmissionPackage } from '../interfaces/submission-package.interface';
import { SubmissionUpdate } from 'src/submission/interfaces/submission-update.interface';

@Controller('file_submission')
export class FileSubmissionController {
  constructor(private readonly service: FileSubmissionService) {}

  @Delete('remove/thumbnail/:id')
  async removeThumbnail(@Param('id') id: string) {
    return this.service.removeThumbnail(id);
  }

  @Delete('remove/additional/:id/:location')
  async removeAdditionalFile(@Param() params) {
    return this.service.removeAdditionalFile(params.id, params.location);
  }

  @Post('change/primary/:id/:path')
  @UseInterceptors(FileInterceptor('file'))
  async changePrimary(@UploadedFile() file, @Param() params) {
    return this.service.changePrimaryFile(file, params.id, params.path);
  }

  @Post('change/thumbnail/:id/:path')
  @UseInterceptors(FileInterceptor('file'))
  async changeThumbnail(@UploadedFile() file, @Param() params) {
    return this.service.changeThumbnailFile(file, params.id, params.path);
  }

  @Post('add/additional/:id/:path')
  @UseInterceptors(FileInterceptor('file'))
  async addAdditionalFile(@UploadedFile() file, @Param() params) {
    return this.service.addAdditionalFile(file, params.id, params.path);
  }
}
