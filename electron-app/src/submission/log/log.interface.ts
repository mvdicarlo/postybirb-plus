import { SubmissionPart } from '../interfaces/submission-part.interface';
import { PostResponse } from '../post/interfaces/post-response.interface';
import { Submission } from '../interfaces/submission.interface';

export interface SubmissionLog {
  id: string;
  submission: Submission;
  parts: PartWithResponse[];
  version: string;
  created: number;
}

export interface PartWithResponse {
  part: SubmissionPart<any>;
  response: PostResponse;
}
