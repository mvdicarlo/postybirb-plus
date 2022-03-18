import { DefaultFileOptions } from '../../submission/default-options.interface';

export interface PicartoFileOptions extends DefaultFileOptions {
  folders: string[];
  visibility: string;
  comments: string;
  downloadSource: boolean;
  softwares: string[];
  category: string;
}
