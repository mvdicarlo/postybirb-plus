import { DefaultFileOptions } from '../../submission/default-options.interface';

export interface FurryLifeFileOptions extends DefaultFileOptions {
  credit?: string;
  copyright?: string;
  album: string;
}
