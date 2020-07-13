import { ArtconomyOptions } from './artconomy.interface';
import { GenericDefaultFileOptions } from '../generic/generic.defaults';

export const ArtconomyDefaultFileOptions: ArtconomyOptions = {
  ...GenericDefaultFileOptions,
  comments_disabled: false,
  is_artist: true,
  private: false,
};
