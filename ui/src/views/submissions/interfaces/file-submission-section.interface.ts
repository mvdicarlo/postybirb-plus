import {
  DefaultOptions,
  SubmissionPart
} from '../../../../../electron-app/src/submission/interfaces/submission-part.interface';
import { FileSubmission } from '../../../../../electron-app/src/submission/file-submission/interfaces/file-submission.interface';

export interface FileSubmissionSectionProps<T> {
  onUpdate: (update: SubmissionPart<T>) => void;
  defaultData?: DefaultOptions;
  part: SubmissionPart<T>;
  problems: string[];
  submission: FileSubmission;
}
