import { WeasylFileOptions } from './weasyl.interface';
import { GenericDefaultFileOptions } from '../generic/generic.defaults';

export const WeasylDefaultFileOptions: WeasylFileOptions = {
  ...GenericDefaultFileOptions,
  notify: true,
  critique: false,
  folder: null,
  category: null,
};
