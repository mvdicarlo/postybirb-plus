import { DefaultFileOptions } from '../../submission/default-options.interface';

export interface MastodonFileOptions extends DefaultFileOptions {
  useTitle: boolean;
  spoilerText?: string;
  visibility: string;
  altText?: string;
  replyToUrl?: string;
}
