import { SubmissionRating } from 'src/submission/enums/submission-rating.enum';

export interface DefaultOptions {
  title?: string;
  tags: TagData;
  description: DescriptionData;
  rating: SubmissionRating;
}

export interface DefaultFileOptions extends DefaultOptions {
  useThumbnail: boolean;
}

export interface TagData {
  extendDefault: boolean;
  value: string[];
}

export interface DescriptionData {
  overwriteDefault: boolean;
  value: string;
}
