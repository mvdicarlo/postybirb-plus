import { PiczelFileOptions } from './piczel.interface';
import { GenericDefaultFileOptions } from '../generic/generic.defaults';

export const PiczelDefaultFileOptions: PiczelFileOptions = {
  ...GenericDefaultFileOptions,
  folder: null,
};
