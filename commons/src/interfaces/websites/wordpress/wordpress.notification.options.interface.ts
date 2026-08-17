import { DefaultOptions } from '../../submission/default-options.interface';

export interface WordPressNotificationOptions extends DefaultOptions {
  slug?: string;
  commentStatus?: string;
  format?: string;
  categories?: string;
  status?: string;
  sticky?: boolean;
}
