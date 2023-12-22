import { SubmissionPart } from './submission-part.interface';

export interface SubmissionUpdate {
  id: string;
  parts: SubmissionPart<any>[];
  removedParts: string[]; // list of SubmissionPart ids
  postAt?: number;
  altTexts: { [key: string]: string };
}
