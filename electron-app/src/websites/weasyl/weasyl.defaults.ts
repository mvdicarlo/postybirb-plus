import { WeasylOptions } from './weasyl.interface';

export const WeasylDefaultFileOptions: WeasylOptions = {
  notify: true,
  critique: false,
  folder: null,
  category: null,
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
