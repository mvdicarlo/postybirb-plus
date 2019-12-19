import { IsNotEmpty } from 'class-validator';
import { Parts } from '../../interfaces/submission-part.interface';

export class UpdateSubmissionTemplateDto {
  @IsNotEmpty()
  id: string;

  @IsNotEmpty()
  parts: Parts;
}
