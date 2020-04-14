import { InkbunnyOptions } from './inkbunny.interface';

export const INKBUNNY_DEFAULT_FILE_SUBMISSION_OPTIONS: InkbunnyOptions = {
  blockGuests: false,
  friendsOnly: false,
  notify: true,
  scraps: false,
  submissionType: undefined,
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
