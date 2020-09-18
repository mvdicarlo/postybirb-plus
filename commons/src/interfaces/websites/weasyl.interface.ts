import { DefaultFileOptions } from '../submission/default-options.interface';

export interface WeasylFileOptions extends DefaultFileOptions {
  category: string | null;
  critique: boolean;
  folder: string | null;
  notify: boolean;
}
