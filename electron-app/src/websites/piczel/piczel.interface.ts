import { DefaultFileOptions } from '../../submission/submission-part/interfaces/default-options.interface';

export interface PiczelOptions extends DefaultFileOptions {
  folder: string | null;
}
