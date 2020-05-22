import { Submission } from 'src/submission/interfaces/submission.interface';
import { SubmissionPart } from 'src/submission/submission-part/interfaces/submission-part.interface';
import {
  DefaultOptions,
  DefaultFileOptions,
} from 'src/submission/submission-part/interfaces/default-options.interface';
import { SubmissionRating } from 'src/submission/enums/submission-rating.enum';

export interface PostData<T extends Submission, K extends DefaultOptions> {
  description: string;
  options: K;
  part: SubmissionPart<any>;
  rating: SubmissionRating;
  sources: string[];
  submission: T;
  tags: string[];
  title: string;
}
