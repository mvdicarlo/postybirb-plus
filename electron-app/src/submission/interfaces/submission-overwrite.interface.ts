import { SubmissionPart } from '../submission-part/interfaces/submission-part.interface';

export interface SubmissionOverwrite {
  id: string;
  parts: Array<SubmissionPart<any>>;
}
