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

  @Get()
  async findAll(): Promise<FileSubmission[]> {
    return this.service.getAll();
  }

  @Get('/packages')
  async findAllPackages(): Promise<Array<SubmissionPackage<FileSubmission>>> {
    return this.service.getAllSubmissionPackages();
  }

  @Get('/package/:id')
  async getPackage(@Param('id') id: string) {
    return this.service.getSubmissionPackage(id);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.service.removeSubmission(id);
  }

  @Delete('remove/thumbnail/:id')
  async removeThumbnail(@Param('id') id: string) {
    return this.service.removeThumbnail(id);
  }

  @Delete('remove/additional/:id/:location')
  async removeAdditionalFile(@Param() params) {
    return this.service.removeAdditionalFile(params.id, params.location);
  }

  @Post('create/:path')
  @UseInterceptors(FileInterceptor('file'))
  async create(@UploadedFile() file, @Param() params) {
    await this.service.createSubmission(file, params.path);
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

  @Post('setPart')
  async setPart(@Body() submissionPart: SubmissionPart<any>) {
    return this.service.setPart(submissionPart);
  }

  @Post('/update')
  async update(@Body() submissionPackage: SubmissionUpdate) {
    return this.service.updateSubmission(submissionPackage);
  }

  @Post('/duplicate/:id')
  async duplicate(@Param('id') id: string) {
    return this.service.duplicateSubmission(id);
  }

  @Post('/dry_validate')
  async dryValidate(@Body() parts: Array<SubmissionPart<any>>) {
    return this.service.dryValidate(parts || []);
  }
}
