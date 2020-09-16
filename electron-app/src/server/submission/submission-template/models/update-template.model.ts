import { IsNotEmpty, IsString, IsObject } from 'class-validator';
import { Parts } from 'postybirb-commons';

export class UpdateSubmissionTemplateModel {
  @IsNotEmpty()
  @IsString()
  id: string;

  @IsNotEmpty()
  @IsObject()
  parts: Parts;
}
