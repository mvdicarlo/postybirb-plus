import { DefaultFileOptions } from '../submission/default-options.interface';

export interface SoFurryFileOptions extends DefaultFileOptions {
  folder: string | null;
  thumbnailAsCoverArt: boolean;
  viewOptions: string;
}
