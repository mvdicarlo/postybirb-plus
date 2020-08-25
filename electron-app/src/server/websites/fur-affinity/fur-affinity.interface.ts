import {
  DefaultFileOptions,
  DefaultOptions,
} from '../../submission/submission-part/interfaces/default-options.interface';

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

export interface FurAffinityNotificationOptions extends DefaultOptions {
  feature: boolean;
}
