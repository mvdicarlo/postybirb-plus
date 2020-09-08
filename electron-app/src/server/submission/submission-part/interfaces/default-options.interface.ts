import { SubmissionRating } from 'postybirb-commons';
import { TagData } from './tag-data.interface';
import { DescriptionData } from './description-data.interface';

export interface DefaultOptions {
  title?: string;
  tags: TagData;
  description: DescriptionData;
  rating: SubmissionRating | null;
  sources?: string[];
}

export interface DefaultFileOptions extends DefaultOptions {
  useThumbnail: boolean;
  autoScale: boolean;
}
