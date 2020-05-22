import { DefaultFileOptions } from '../../submission/submission-part/interfaces/default-options.interface';

export interface SoFurryFileOptions extends DefaultFileOptions {
  folder: string | null;
  thumbnailAsCoverArt: boolean;
  viewOptions: string;
}
