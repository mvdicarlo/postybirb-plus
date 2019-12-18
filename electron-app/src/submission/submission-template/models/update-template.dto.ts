import { IsNotEmpty } from 'class-validator';
import { SubmissionPart } from '../../interfaces/submission-part.interface';

export class UpdateSubmissionTemplateDto {
  @IsNotEmpty()
  id: string;

  @IsNotEmpty()
  parts: Array<SubmissionPart<any>>;
}
