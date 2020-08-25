import { IsOptional, IsObject, IsString, IsNotEmpty, IsEnum } from 'class-validator';
import { UploadedFile } from 'src/server/file-manager/interfaces/uploaded-file.interface';
import { SubmissionType } from '../enums/submission-type.enum';
import { SubmissionCreate } from '../interfaces/submission-create.interface';

export default class SubmissionCreateModel implements SubmissionCreate {
  @IsEnum(SubmissionType)
  @IsNotEmpty()
  type: SubmissionType;

  @IsObject()
  @IsOptional()
  file: UploadedFile;

  @IsString()
  @IsOptional()
  path: string;

  @IsString()
  @IsOptional()
  title: string;

  @IsString()
  @IsOptional()
  parts: string; // Array<SubmissionPart<any>>;

  constructor(partial?: Partial<SubmissionCreateModel>) {
    Object.assign(this, partial);
  }
}
