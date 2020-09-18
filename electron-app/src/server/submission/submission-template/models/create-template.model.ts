import { IsNotEmpty, IsEnum, IsString } from 'class-validator';
import { SubmissionType } from 'postybirb-commons';

export class CreateSubmissionTemplateModel {
  @IsNotEmpty()
  @IsString()
  alias: string;

  @IsNotEmpty()
  @IsEnum(SubmissionType)
  type: SubmissionType;
}
