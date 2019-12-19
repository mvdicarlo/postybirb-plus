import { SubmissionType } from '../enums/submission-type.enum';
import { SubmissionPart, Parts } from '../interfaces/submission-part.interface';

export interface SubmissionTemplate {
  _id?: string;
  id: string;
  alias: string;
  type: SubmissionType;
  parts: Parts;
  created: number;
}

export interface SubmissionTemplateUpdateDto {
  id: string;
  parts: Parts;
}
