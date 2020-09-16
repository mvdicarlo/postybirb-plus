import { SoFurryFileOptions } from 'postybirb-commons';
import { GenericDefaultFileOptions } from '../generic/generic.defaults';

export const SoFurryDefaultFileOptions: SoFurryFileOptions = {
  ...GenericDefaultFileOptions,
  folder: '0',
  viewOptions: '0',
  thumbnailAsCoverArt: false,
};
