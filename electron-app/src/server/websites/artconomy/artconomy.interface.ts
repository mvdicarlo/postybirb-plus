import { DefaultFileOptions } from '../../submission/submission-part/interfaces/default-options.interface';

export interface ArtconomyFileOptions extends DefaultFileOptions {
  commentsDisabled: boolean;
  isArtist: boolean;
  private: boolean;
}
