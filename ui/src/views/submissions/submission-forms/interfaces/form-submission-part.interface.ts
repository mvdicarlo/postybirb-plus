import { SubmissionPart } from 'postybirb-commons';
import { DefaultOptions } from 'postybirb-commons';

export interface FormSubmissionPart<T extends DefaultOptions> extends SubmissionPart<T> {
  isNew?: boolean;
}
