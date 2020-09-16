import { DefaultFileOptions } from '../submission/default-options.interface';

export interface DeviantArtFileOptions extends DefaultFileOptions {
  feature: boolean;
  disableComments: boolean;
  critique: boolean;
  freeDownload: boolean;
  folders: string[];
  matureClassification: string[];
  matureLevel: string;
  displayResolution: string;
  scraps: boolean;
}
