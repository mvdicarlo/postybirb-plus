import { DefaultFileOptions } from '../../submission/default-options.interface';

export interface WeasylFileOptions extends DefaultFileOptions {
  category?: string;
  critique: boolean;
  folder?: string;
  notify: boolean;
}
