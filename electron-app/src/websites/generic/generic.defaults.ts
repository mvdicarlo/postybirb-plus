import { DefaultFileOptions } from '../../submission/submission-part/interfaces/default-options.interface';

export const GENERIC_DEFAULT_FILE_SUBMISSION_OPTIONS: DefaultFileOptions = {
  tags: {
    extendDefault: true,
    value: [],
  },
  description: {
    overwriteDefault: false,
    value: '',
  },
  rating: null,
  useThumbnail: true,
  autoScale: true,
};
