import { SubmissionType } from '../enums/submission-type.enum';
import { SubmissionPart } from '../interfaces/submission-part.interface';

export interface SubmissionTemplate {
  _id?: string;
  id: string;
  alias: string;
  type: SubmissionType;
  parts: { [key: string]: SubmissionPart<any> }; // key is part.accountId;
  created: number;
}
