import { SubmissionPart } from './submission-part.interface';

export interface SubmissionOverwrite {
  id: string;
  parts: SubmissionPart<any>[];
}
