import { DefaultFileOptions } from '../../submission/default-options.interface';

export interface ArtconomyFileOptions extends DefaultFileOptions {
  commentsDisabled: boolean;
  isArtist: boolean;
  private: boolean;
}
