import SubmissionEntity from 'src/submission/models/submission.entity';
import { FileSubmission } from '../interfaces/file-submission.interface';
import { FileRecord } from '../interfaces/file-record.interface';
import { IsNotEmpty, IsOptional, IsArray, IsObject } from 'class-validator';

export default class FileSubmissionEntity extends SubmissionEntity implements FileSubmission {
  @IsNotEmpty()
  @IsObject()
  primary: FileRecord;

  @IsOptional()
  thumbnail: FileRecord;

  @IsArray()
  additional: FileRecord[];

  constructor(partial: Partial<FileSubmissionEntity>) {
    super(partial);
    if (!this.additional) {
      this.additional = [];
    }
  }
}
