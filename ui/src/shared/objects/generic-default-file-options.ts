import { DefaultFileOptions } from '../../../../electron-app/src/submission/submission-part/interfaces/default-options.interface';

export const GenericDefaultFileOptions: DefaultFileOptions = {
  tags: {
    extendDefault: true,
    value: []
  },
  description: {
    overwriteDefault: false,
    value: ''
  },
  rating: null,
  useThumbnail: true,
  autoScale: true
};
