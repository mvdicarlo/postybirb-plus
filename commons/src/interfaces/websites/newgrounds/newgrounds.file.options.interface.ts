import { DefaultFileOptions } from '../../submission/default-options.interface';

export type NewgroundsRating = 'a' | 'b' | 'c';

export interface NewgroundsFileOptions extends DefaultFileOptions {
  creativeCommons: boolean;
  commercial: boolean;
  modification: boolean;
  sketch: boolean;
  category: string;
  nudity?: NewgroundsRating;
  violence?: NewgroundsRating;
  explicitText?: NewgroundsRating;
  adultThemes?: NewgroundsRating;
}
