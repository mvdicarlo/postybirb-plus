import { FurAffinityFileOptions, FurAffinityNotificationOptions } from './fur-affinity.interface';

export const FURAFFINITY_DEFAULT_FILE_SUBMISSION_OPTIONS: FurAffinityFileOptions = {
  category: '1',
  disableComments: false,
  folders: [],
  gender: '0',
  reupload: true,
  scraps: false,
  species: '1',
  theme: '1',
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

export const FURAFFINITY_DEFAULT_NOTIFICATION_SUBMISSION_OPTIONS: FurAffinityNotificationOptions = {
  feature: true,
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
