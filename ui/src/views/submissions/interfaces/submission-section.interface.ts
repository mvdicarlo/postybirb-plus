import {
  DefaultOptions,
  SubmissionPart
} from '../../../../../electron-app/src/submission/interfaces/submission-part.interface';
import { Submission } from '../../../../../electron-app/src/submission/interfaces/submission.interface';

export interface SubmissionSectionProps<T extends Submission, K extends DefaultOptions> {
  onUpdate: (update: SubmissionPart<K>) => void;
  defaultData?: DefaultOptions;
  part: SubmissionPart<K>;
  problems: string[];
  submission: T;
}
