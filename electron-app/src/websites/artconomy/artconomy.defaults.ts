import { ArtconomyFileOptions } from './artconomy.interface';
import { GenericDefaultFileOptions } from '../generic/generic.defaults';

export const ArtconomyDefaultFileOptions: ArtconomyFileOptions = {
  ...GenericDefaultFileOptions,
  commentsDisabled: false,
  isArtist: true,
  private: false,
};
