import { SubmissionType } from '../enums/submission-type.enum';

export interface SubmissionCreate {
  type: SubmissionType;
  data: any;
}
