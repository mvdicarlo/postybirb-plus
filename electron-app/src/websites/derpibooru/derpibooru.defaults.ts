import { DerpibooruOptions } from './derpibooru.interface';

export const DERPIBOORU_DEFAULT_FILE_SUBMISSION_OPTIONS: DerpibooruOptions = {
  source: null,
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
