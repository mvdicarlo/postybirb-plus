import { DefaultFileOptions } from '../../submission/default-options.interface';

export interface WordPressFileOptions extends DefaultFileOptions {
  slug?: string;
  commentStatus?: string;
  format?: string;
  categories?: string;
  status?: string;
  sticky?: boolean;
}
