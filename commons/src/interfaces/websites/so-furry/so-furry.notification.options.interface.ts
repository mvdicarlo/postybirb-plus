import { DefaultOptions } from '../../submission/default-options.interface';

export interface SoFurryNotificationOptions extends DefaultOptions {
  folder?: string;
  thumbnailAsCoverArt: boolean;
  viewOptions: string;
}
