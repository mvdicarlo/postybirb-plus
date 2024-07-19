import { DefaultFileOptions } from '../../submission/default-options.interface';

export interface DeviantArtFileOptions extends DefaultFileOptions {
  disableComments: boolean;
  freeDownload: boolean;
  folders: string[];
  isMature: boolean;
  displayResolution: string;
  scraps: boolean;
  noAI: boolean;
  isAIGenerated: boolean;
  isCreativeCommons: boolean;
  isCommercialUse: boolean;
  allowModifications: string;
}
