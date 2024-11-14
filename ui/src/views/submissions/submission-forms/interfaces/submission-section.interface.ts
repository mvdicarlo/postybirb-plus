import { SubmissionPart, SubmissionType } from 'postybirb-commons';
import { Submission } from 'postybirb-commons';
import { DefaultOptions } from 'postybirb-commons';
import { Problem } from 'postybirb-commons';
import { SettingsStore } from '../../../../stores/settings.store';

export interface SubmissionSectionProps<T extends Submission, K extends DefaultOptions> {
  onUpdate: (update: SubmissionPart<K>) => void;
  defaultData?: DefaultOptions;
  part: SubmissionPart<K>;
  problems?: Problem;
  submission: T;
  settingsStore?: SettingsStore;
  parentOptions?: { id: string; type: SubmissionType; title: string }[];
}
