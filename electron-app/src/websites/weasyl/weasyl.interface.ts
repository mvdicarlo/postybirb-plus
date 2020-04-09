import { DefaultFileOptions } from '../../submission/submission-part/interfaces/default-options.interface';

export interface WeasylOptions extends DefaultFileOptions {
  category: string | null;
  critique: boolean;
  folder: string | null;
  notify: boolean;
}
