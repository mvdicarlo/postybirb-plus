import { SubmissionPart } from '../../../../../electron-app/src/submission/interfaces/submission-part.interface';

export interface FormSubmissionPart<T> extends SubmissionPart<T> {
  isNew?: boolean;
}
