import { PixivFileOptions } from 'postybirb-commons';
import { GenericDefaultFileOptions } from '../generic/generic.defaults';

export const PixivDefaultFileOptions: PixivFileOptions = {
  ...GenericDefaultFileOptions,
  communityTags: true,
  matureContent: [],
  original: false,
  sexual: undefined,
  containsContent: [],
};
