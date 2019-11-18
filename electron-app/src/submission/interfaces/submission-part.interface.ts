import { SubmissionRating } from 'src/submission/enums/submission-rating.enum';

export interface SubmissionPart<T> {
  data: T;
  accountId: string;
  submissionId: string;
  website: string;
}

export interface DefaultOptions {
  title?: string;
  tags: TagData;
  description: DescriptionData;
  rating: SubmissionRating;
}

export interface TagData {
  extendDefault: boolean;
  value: string[];
}

export interface DescriptionData {
  overwriteDefault: boolean;
  value: string;
}