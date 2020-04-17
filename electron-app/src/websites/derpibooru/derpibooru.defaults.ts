import { DerpibooruOptions } from './derpibooru.interface';

export const DerpibooruDefaultFileOptions: DerpibooruOptions = {
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
