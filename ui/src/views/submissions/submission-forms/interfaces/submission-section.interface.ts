import { SubmissionPart } from 'postybirb-commons';
import { Submission } from 'postybirb-commons';
import { DefaultOptions } from 'postybirb-commons';
import { Problem } from 'postybirb-commons';

export interface SubmissionSectionProps<T extends Submission, K extends DefaultOptions> {
  onUpdate: (update: SubmissionPart<K>) => void;
  defaultData?: DefaultOptions;
  part: SubmissionPart<K>;
  problems?: Problem;
  submission: T;
}
