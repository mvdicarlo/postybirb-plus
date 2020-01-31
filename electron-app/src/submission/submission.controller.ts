import {
  Controller,
  Get,
  Query,
  Body,
  Post,
  Param,
  Delete,
  UseInterceptors,
  UploadedFile,
  Patch,
} from '@nestjs/common';
import { SubmissionService } from './submission.service';
import { SubmissionType } from './enums/submission-type.enum';
import { SubmissionUpdate } from './interfaces/submission-update.interface';
import { SubmissionOverwrite } from './interfaces/submission-overwrite.interface';
import { SubmissionPart } from './submission-part/interfaces/submission-part.interface';
import { FileInterceptor } from '@nestjs/platform-express';
import { FileRecord } from './file-submission/interfaces/file-record.interface';
import SubmissionScheduleModel from './models/submission-schedule.model';
import SubmissionLogEntity from './log/models/submission-log.entity';

@Controller('submission')
export class SubmissionController {
  constructor(private readonly service: SubmissionService) {}

  private isTrue(value: string): boolean {
    return value === 'true' || value === '';
  }

  @Get()
  async getSubmissions(
    @Query('packaged') packaged: string,
    @Query('type') submissionType: SubmissionType,
  ) {
    return this.isTrue(packaged)
      ? this.service.getAllAndValidate(submissionType)
      : this.service.getAll(submissionType);
  }

  @Get(':id')
  async get(@Param('id') id: string, @Query('packaged') packaged: string) {
    return this.isTrue(packaged) ? this.service.getAndValidate(id) : this.service.get(id);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.service.deleteSubmission(id);
  }

  @Post('create/:type')
  @UseInterceptors(FileInterceptor('file'))
  async create(@UploadedFile() file, @Param('type') type: SubmissionType, @Query() query: any) {
    return this.service.create({
      type,
      data: {
        ...query,
        file,
      },
    });
  }

  @Post('recreate')
  async recreateFromLog(@Body() log: SubmissionLogEntity) {
    return this.service.recreate(log);
  }

  @Patch('update')
  async update(@Body() submissionPackage: SubmissionUpdate) {
    return this.service.updateSubmission(submissionPackage);
  }

  @Post('overwrite')
  async overwriteSubmissionParts(@Body() submissionOverwrite: SubmissionOverwrite) {
    return this.service.overwriteSubmissionParts(submissionOverwrite);
  }

  @Patch('set/postAt/:id')
  async setPostAt(@Body() body: SubmissionScheduleModel, @Param('id') id: string) {
    return this.service.setPostAt(id, body.postAt);
  }

  @Post('dryValidate')
  async dryValidate(@Body() body: { id: string; parts: Array<SubmissionPart<any>> }) {
    return this.service.dryValidate(body.id, body.parts || []);
  }

  @Post('duplicate/:id')
  async duplicate(@Param('id') id: string) {
    return this.service.duplicate(id);
  }

  @Post('schedule/:id')
  async scheduleSubmission(
    @Body() data: { isScheduled: boolean; postAt?: number },
    @Param('id') id: string,
  ) {
    return this.service.scheduleSubmission(id, data.isScheduled, data.postAt);
  }

  @Post('splitAdditional/:id')
  async splitAdditional(@Param('id') id: string) {
    return this.service.splitAdditionalIntoSubmissions(id);
  }

  // File Submission File Actions
  @Get('fallback/:id')
  async getFallbackText(@Param('id') id: string) {
    return this.service.getFallbackText(id);
  }

  @Delete('remove/thumbnail/:id')
  async removeThumbnail(@Param('id') id: string) {
    return this.service.removeFileSubmissionThumbnail(id);
  }

  @Delete('remove/additional/:id/:location')
  async removeAdditionalFile(@Param() params) {
    return this.service.removeFileSubmissionAdditionalFile(params.id, params.location);
  }

  @Post('change/primary/:id/:path')
  @UseInterceptors(FileInterceptor('file'))
  async changePrimary(@UploadedFile() file, @Param() params) {
    return this.service.changeFileSubmissionPrimaryFile(file, params.id, params.path);
  }

  @Post('change/fallback/:id')
  @UseInterceptors(FileInterceptor('file'))
  async changeFallback(@UploadedFile() file, @Param('id') id: string) {
    return this.service.setFallbackFile(file, id);
  }

  @Post('change/thumbnail/:id/:path')
  @UseInterceptors(FileInterceptor('file'))
  async changeThumbnail(@UploadedFile() file, @Param() params) {
    return this.service.changeFileSubmissionThumbnailFile(file, params.id, params.path);
  }

  @Post('add/additional/:id/:path')
  @UseInterceptors(FileInterceptor('file'))
  async addAdditionalFile(@UploadedFile() file, @Param() params) {
    return this.service.addFileSubmissionAdditionalFile(file, params.id, params.path);
  }

  @Patch('update/additional/:id')
  async updateAdditionalFileData(@Body() record: FileRecord, @Param('id') id: string) {
    return this.service.updateFileSubmissionAdditionalFile(id, record);
  }
}
