import { Submission, SubmissionPart, DefaultOptions, DefaultFileOptions } from 'postybirb-commons';

import { SubmissionRating } from 'postybirb-commons';

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
