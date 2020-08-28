import { IsNotEmpty, IsString, IsObject } from 'class-validator';
import { Parts } from 'src/server/submission/submission-part/interfaces/submission-part.interface';

export class UpdateSubmissionTemplateModel {
  @IsNotEmpty()
  @IsString()
  id: string;

  @IsNotEmpty()
  @IsObject()
  parts: Parts;
}
