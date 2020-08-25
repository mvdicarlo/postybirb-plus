import { IsNotEmpty, IsEnum, IsString } from 'class-validator';
import { SubmissionType } from '../../enums/submission-type.enum';

export class CreateSubmissionTemplateModel {
  @IsNotEmpty()
  @IsString()
  alias: string;

  @IsNotEmpty()
  @IsEnum(SubmissionType)
  type: SubmissionType;
}
