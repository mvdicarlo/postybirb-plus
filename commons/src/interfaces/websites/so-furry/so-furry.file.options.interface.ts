import { DefaultFileOptions } from '../../submission/default-options.interface';

export interface SoFurryFileOptions extends DefaultFileOptions {
  folder?: string;
  thumbnailAsCoverArt: boolean;
  viewOptions: string;
}
