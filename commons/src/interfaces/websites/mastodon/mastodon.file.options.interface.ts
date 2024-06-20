import { DefaultFileOptions } from '../../submission/default-options.interface';

export interface MastodonFileOptions extends DefaultFileOptions {
  useTitle: boolean;
  spoilerText?: string;
  spoilerTextOverwrite?: boolean;
  visibility: string;
  altText?: string;
  replyToUrl?: string;
}
