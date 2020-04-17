import { e621Options } from './e621.interface';

export const e621DefaultFileOptions: e621Options = {
  sources: [],
  parentId: undefined,
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
