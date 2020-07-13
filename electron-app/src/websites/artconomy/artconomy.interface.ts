import { DefaultFileOptions } from '../../submission/submission-part/interfaces/default-options.interface';

export interface ArtconomyOptions extends DefaultFileOptions {
  comments_disabled: boolean,
  is_artist: boolean,
  private: boolean,
}
