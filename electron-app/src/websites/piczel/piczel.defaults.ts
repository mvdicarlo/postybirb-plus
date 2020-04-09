import { PiczelOptions } from './piczel.interface';

export const PICZEL_DEFAULT_FILE_SUBMISSION_OPTIONS: PiczelOptions = {
  folder: null,
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
