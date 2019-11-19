import {
  DefaultOptions,
  SubmissionPart
} from '../../../../../electron-app/src/submission/interfaces/submission-part.interface';

export interface FileSubmissionSectionProps<T> {
  onUpdate: (update: SubmissionPart<T>) => void;
  defaultValues?: DefaultOptions;
  part: SubmissionPart<T>;
}
