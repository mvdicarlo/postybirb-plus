import { SubmissionPart } from '../../../../../electron-app/src/submission/interfaces/submission-part.interface';
import { DefaultOptions } from '../../../../../electron-app/src/submission/interfaces/default-options.interface';

export interface FormSubmissionPart<T extends DefaultOptions> extends SubmissionPart<T> {
  isNew?: boolean;
}
