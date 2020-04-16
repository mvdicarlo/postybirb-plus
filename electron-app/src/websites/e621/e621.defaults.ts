import { e621Options } from './e621.interface';

export const E621_DEFAULT_FILE_SUBMISSION_OPTIONS: e621Options = {
  sources: [],
  parentId: undefined,
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
