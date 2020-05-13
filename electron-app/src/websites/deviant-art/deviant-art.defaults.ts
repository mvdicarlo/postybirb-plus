import { DeviantArtFileOptions } from './deviant-art.interface';
import { GenericDefaultFileOptions } from '../generic/generic.defaults';

export const DeviantArtDefaultFileOptions: DeviantArtFileOptions = {
  ...GenericDefaultFileOptions,
  feature: false,
  disableComments: false,
  critique: false,
  freeDownload: false,
  folders: [],
  matureClassification: [],
  matureLevel: undefined,
  displayResolution: '0',
};
