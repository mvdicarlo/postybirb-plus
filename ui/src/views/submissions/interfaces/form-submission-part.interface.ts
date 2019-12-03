import { SubmissionPart, DefaultOptions } from '../../../../../electron-app/src/submission/interfaces/submission-part.interface';

export interface FormSubmissionPart<T extends DefaultOptions> extends SubmissionPart<T> {
  isNew?: boolean;
}
