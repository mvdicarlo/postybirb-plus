import { SubmissionRating } from 'src/server/submission/enums/submission-rating.enum';
import { TagData } from './tag-data.interface';
import { DescriptionData } from './description-data.interface';

export interface DefaultOptions {
  title?: string;
  tags: TagData;
  description: DescriptionData;
  rating: SubmissionRating;
  sources?: string[];
}

export interface DefaultFileOptions extends DefaultOptions {
  useThumbnail: boolean;
  autoScale: boolean;
}
