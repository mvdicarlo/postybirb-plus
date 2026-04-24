import { DefaultFileOptions } from '../../submission/default-options.interface';

export interface SoFurryFileOptions extends DefaultFileOptions {
  folder?: string;
  category: string;
  type: string;
  privacy: string;
  allowComments: boolean;
  allowDownloads: boolean;
  intendedAsAdvertisement: boolean;
  isWip: boolean;
  pixelPerfectDisplay: boolean;
}
