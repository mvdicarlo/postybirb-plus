import { DefaultOptions } from '../../submission/interfaces/submission-part.interface';

export interface DefaultWeasylSubmissionOptions extends DefaultOptions {
  category: string|null;
  critique: boolean;
  folder: string|null;
  notify: boolean;
}
