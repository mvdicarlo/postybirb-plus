import { SubmissionPart } from '../../../../../../electron-app/src/server/submission/submission-part/interfaces/submission-part.interface';
import { DefaultOptions } from '../../../../../../electron-app/src/server/submission/submission-part/interfaces/default-options.interface';

export interface FormSubmissionPart<T extends DefaultOptions> extends SubmissionPart<T> {
  isNew?: boolean;
}
