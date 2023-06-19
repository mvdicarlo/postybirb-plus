import { IsOptional, IsObject, IsString, IsNotEmpty, IsEnum } from 'class-validator';
import { UploadedFile, SubmissionCreate } from 'postybirb-commons';
import { SubmissionType } from 'postybirb-commons';

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

  @IsObject()
  @IsOptional()
  thumbnailFile: UploadedFile;

  @IsString()
  @IsOptional()
  thumbnailPath: string;

  constructor(partial?: Partial<SubmissionCreateModel>) {
    Object.assign(this, partial);
  }
}
