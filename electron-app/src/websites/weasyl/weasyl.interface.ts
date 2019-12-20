import { DefaultFileOptions } from '../../submission/interfaces/default-options.interface';

export interface DefaultWeasylOptions extends DefaultFileOptions {
  category: string | null;
  critique: boolean;
  folder: string | null;
  notify: boolean;
}
