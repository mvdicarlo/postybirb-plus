import { SubmissionPart } from './submission-part.interface';

export interface SubmissionUpdate {
  id: string;
  parts: Array<SubmissionPart<any>>;
  removedParts: string[]; // list of SubmissionPart ids
  postAt?: number;
}
