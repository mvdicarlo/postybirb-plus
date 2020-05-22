import { DefaultFileOptions } from '../../submission/submission-part/interfaces/default-options.interface';

export interface FurryLifeFileOptions extends DefaultFileOptions {
  credit?: string;
  copyright?: string;
  album: string;
}
