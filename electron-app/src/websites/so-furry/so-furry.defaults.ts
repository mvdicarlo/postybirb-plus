import { SoFurryOptions } from './so-furry.interface';

export const SoFurryDefaultFileOptions: SoFurryOptions = {
  folder: '0',
  viewOptions: '0',
  thumbnailAsCoverArt: false,
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
