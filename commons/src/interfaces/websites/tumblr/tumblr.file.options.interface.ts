import { DefaultFileOptions } from '../../submission/default-options.interface';

export interface TumblrFileOptions extends DefaultFileOptions {
  blog?: string;
  useTitle: boolean;
}
