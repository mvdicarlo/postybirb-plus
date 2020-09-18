import { DefaultFileOptions } from 'postybirb-commons';

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
