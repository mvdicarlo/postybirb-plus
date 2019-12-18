import { IsNotEmpty } from 'class-validator';
import { SubmissionType } from '../../enums/submission-type.enum';

export class CreateSubmissionTemplateDto {
  @IsNotEmpty()
  alias: string;

  @IsNotEmpty()
  type: SubmissionType;
}
