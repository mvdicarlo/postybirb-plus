import { DefaultFileOptions } from '../../submission/default-options.interface';

export interface ItakuFileOptions extends DefaultFileOptions {
  folders: string[];
  visibility: string;
  shareOnFeed: boolean;
}
