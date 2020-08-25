import { SubmissionPart } from '../../../../../../electron-app/src/server/submission/submission-part/interfaces/submission-part.interface';
import { Submission } from '../../../../../../electron-app/src/server/submission/interfaces/submission.interface';
import { DefaultOptions } from '../../../../../../electron-app/src/server/submission/submission-part/interfaces/default-options.interface';
import { Problem } from '../../../../../../electron-app/src/server/submission/validator/interfaces/problems.interface';

export interface SubmissionSectionProps<T extends Submission, K extends DefaultOptions> {
  onUpdate: (update: SubmissionPart<K>) => void;
  defaultData?: DefaultOptions;
  part: SubmissionPart<K>;
  problems?: Problem;
  submission: T;
}
