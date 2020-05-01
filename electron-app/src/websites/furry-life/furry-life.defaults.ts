import { FurryLifeFileOptions } from './furry-life.interface';
import { GenericDefaultFileOptions } from '../generic/generic.defaults';

export const FurryLifeDefaultFileOptions: FurryLifeFileOptions = {
  ...GenericDefaultFileOptions,
  credit: undefined,
  copyright: undefined,
  album: '0-sfw',
};
