import { SubmissionPart } from './submission-part.interface';

export interface SubmissionUpdate {
  id: string;
  parts: Array<SubmissionPart<any>>;
}
