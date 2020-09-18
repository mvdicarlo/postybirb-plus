import { Submission } from 'postybirb-commons';
import { DefaultOptions } from 'postybirb-commons';
import { SubmissionSectionProps } from '../../views/submissions/submission-forms/interfaces/submission-section.interface';
import { TagOptions } from '../../views/submissions/submission-forms/form-components/TagInput';
import { SubmissionRating } from 'postybirb-commons';

export interface WebsiteSectionProps<T extends Submission, K extends DefaultOptions>
  extends SubmissionSectionProps<T, K> {
  hideTitle?: boolean;
  hideThumbnailOptions?: boolean;
  descriptionOptions?: {
    show: boolean;
    options?: {
      lengthParser?: (text: string) => number;
      anchorLength?: number;
    };
  };
  tagOptions?: {
    show: boolean;
    options?: TagOptions;
  };
  ratingOptions?: {
    show: boolean;
    ratings?: {
      value: SubmissionRating | string;
      name: string;
    }[];
  };
}
