import { Submission } from 'src/submission/interfaces/submission.interface';
import { SubmissionPart } from 'src/submission/submission-part/interfaces/submission-part.interface';

export interface PostData<T extends Submission> {
  description: string;
  options: any;
  part: SubmissionPart<any>;
  rating: string;
  sources: string[];
  submission: T;
  tags: string[];
  title: string;
}
