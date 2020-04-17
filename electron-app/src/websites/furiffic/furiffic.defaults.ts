import { FurifficOptions } from './furiffic.interface';

export const FurifficDefaultFileOptions: FurifficOptions = {
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
