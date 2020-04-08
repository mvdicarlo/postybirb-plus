import { DefaultFurifficOptions } from './furiffic.interface';

export const FURIFFIC_DEFAULT_FILE_SUBMISSION_OPTIONS: DefaultFurifficOptions = {
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
