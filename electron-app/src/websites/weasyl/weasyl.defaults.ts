import { DefaultWeasylSubmissionOptions } from './weasyl.interface';

export const DEFAULT_FILE_SUBMISSION_OPTIONS: DefaultWeasylSubmissionOptions = {
  notify: true,
  critique: false,
  folder: null,
  category: null,
  tags: {
    extendDefault: true,
    value: [],
  },
  description: {
    overwriteDefault: false,
    value: '',
  },
  rating: null,
};
