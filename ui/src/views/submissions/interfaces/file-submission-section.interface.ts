import {
  DefaultOptions,
  SubmissionPart
} from '../../../../../electron-app/src/submission/interfaces/submission-part.interface';

export interface FileSubmissionSectionProps<T> {
  onUpdate: (update: SubmissionPart<T>) => void;
  defaultData?: DefaultOptions;
  part: SubmissionPart<T>;
  problems: string[];
}
