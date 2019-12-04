import {
  Controller,
  Logger,
  Get,
  Query,
  Body,
  Post,
  Param,
  Delete,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { SubmissionService } from './submission.service';
import { SubmissionType } from './enums/submission-type.enum';
import { SubmissionUpdate } from './interfaces/submission-update.interface';
import { SubmissionPart } from './interfaces/submission-part.interface';
import { FileInterceptor } from '@nestjs/platform-express';

@Controller('submission')
export class SubmissionController {
  private readonly logger = new Logger(SubmissionController.name);

  constructor(private readonly service: SubmissionService) {}

  private isTrue(value: string): boolean {
    return value === 'true' || value === '';
  }

  @Get()
  async getSubmissions(
    @Query('packaged') packaged: string,
    @Query('type') submissionType: SubmissionType,
  ) {
    return this.service.getAll(this.isTrue(packaged), submissionType);
  }

  @Get(':id')
  async get(@Param('id') id: string, @Query('packaged') packaged: string) {
    return this.service.get(id, this.isTrue(packaged));
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.service.deleteSubmission(id);
  }

  @Post('create/:type')
  @UseInterceptors(FileInterceptor('file'))
  async create(@UploadedFile() file, @Param('type') type: SubmissionType, @Query() query) {
    return this.service.create({
      type,
      data: {
        ...query,
        file,
      },
    });
  }

  @Post('/update')
  async update(@Body() submissionPackage: SubmissionUpdate) {
    return this.service.updateSubmission(submissionPackage);
  }

  @Post('/dryValidate')
  async dryValidate(@Body() parts: Array<SubmissionPart<any>>) {
    return this.service.dryValidate(parts || []);
  }

  @Post('/duplicate/:id')
  async duplicate(@Param('id') id: string) {
    return this.service.duplicate(id);
  }
}
