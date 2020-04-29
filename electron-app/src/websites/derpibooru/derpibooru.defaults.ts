import { DerpibooruOptions } from './derpibooru.interface';
import { GenericDefaultFileOptions } from '../generic/generic.defaults';

export const DerpibooruDefaultFileOptions: DerpibooruOptions = {
  ...GenericDefaultFileOptions,
  source: null,
};
