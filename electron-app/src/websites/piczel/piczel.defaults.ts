import { PiczelOptions } from './piczel.interface';

export const PiczelDefaultFileOptions: PiczelOptions = {
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
