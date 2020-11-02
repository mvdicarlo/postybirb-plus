import { DefaultFileOptions } from '../../submission/default-options.interface';

export interface FurAffinityFileOptions extends DefaultFileOptions {
  category: string;
  disableComments: boolean;
  folders: string[];
  gender: string;
  reupload: boolean;
  scraps: boolean;
  species: string;
  theme: string;
}
