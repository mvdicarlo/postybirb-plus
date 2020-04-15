import { DefaultFileOptions } from '../../submission/submission-part/interfaces/default-options.interface';

export interface SoFurryOptions extends DefaultFileOptions {
  folder: string | null;
  thumbnailAsCoverArt: boolean;
  viewOptions: string;
}
