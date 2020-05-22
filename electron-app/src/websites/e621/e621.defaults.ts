import { e621Options } from './e621.interface';
import { GenericDefaultFileOptions } from '../generic/generic.defaults';

export const e621DefaultFileOptions: e621Options = {
  ...GenericDefaultFileOptions,
  sources: [],
  parentId: undefined,
};
