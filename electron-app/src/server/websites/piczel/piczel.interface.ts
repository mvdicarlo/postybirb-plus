import { DefaultFileOptions } from '../../submission/submission-part/interfaces/default-options.interface';

export interface PiczelFileOptions extends DefaultFileOptions {
  folder: string | null;
}
