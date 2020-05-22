import { Submission } from '../../../../electron-app/src/submission/interfaces/submission.interface';
import { DefaultOptions } from '../../../../electron-app/src/submission/submission-part/interfaces/default-options.interface';
import { SubmissionSectionProps } from '../../views/submissions/submission-forms/interfaces/submission-section.interface';
import { TagOptions } from '../../views/submissions/submission-forms/form-components/TagInput';

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
      value: 'general' | 'mature' | 'adult' | 'extreme' | string;
      name: string;
    }[];
  };
}
