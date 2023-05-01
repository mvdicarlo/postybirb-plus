import { DefaultFileOptions } from '../../submission/default-options.interface';

export interface PixelfedFileOptions extends DefaultFileOptions {
  useTitle: boolean;
  spoilerText?: string;
  visibility: string;
  altText?: string;
}
