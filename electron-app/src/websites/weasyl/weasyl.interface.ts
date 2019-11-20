import { DefaultOptions } from '../../submission/interfaces/submission-part.interface';

export interface DefaultWeasylSubmissionOptions extends DefaultOptions {
  notify: boolean;
  critique: boolean;
  folder: string|null;
  category: string|null;
}
