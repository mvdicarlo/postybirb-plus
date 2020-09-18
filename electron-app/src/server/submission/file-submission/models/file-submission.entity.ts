import SubmissionEntity from 'src/server/submission/models/submission.entity';
import { FileSubmission, FileRecord } from 'postybirb-commons';

import { IsNotEmpty, IsOptional, IsArray, IsObject } from 'class-validator';

export default class FileSubmissionEntity extends SubmissionEntity implements FileSubmission {
  @IsNotEmpty()
  @IsObject()
  primary: FileRecord;

  @IsOptional()
  thumbnail: FileRecord;

  @IsOptional()
  fallback: FileRecord;

  @IsArray()
  additional: FileRecord[];

  constructor(partial: Partial<FileSubmissionEntity>) {
    super(partial);
    if (!this.additional) {
      this.additional = [];
    }
  }
}
